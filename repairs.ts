import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getStats = query({
  args: {},
  returns: v.object({
    open: v.number(),
    inProgress: v.number(),
    completedToday: v.number(),
    overdue: v.number(),
  }),
  handler: async (ctx) => {
    const orders = await ctx.db.query("repair_orders").collect();
    const open = orders.filter(o => o.status === "intake").length;
    const inProgress = orders.filter(o => ["diagnosing", "in_repair", "waiting_parts"].includes(o.status)).length;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const details = await ctx.db.query("repair_details").collect();
    const completedToday = details.filter(d => d.completed_at && d.completed_at >= startOfToday).length;
    
    const overdue = orders.filter(o => o.estimated_completion_at && o.estimated_completion_at < now.getTime() && o.status !== "completed" && o.status !== "picked_up" && o.status !== "cancelled").length;
    
    return { open, inProgress, completedToday, overdue };
  },
});

export const listRecentOrders = query({
  args: { limit: v.number() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const orders = await ctx.db.query("repair_orders").order("desc").take(args.limit);
    const result = [];
    for (const order of orders) {
      const device = await ctx.db
        .query("devices")
        .withIndex("by_repair_order_id", (q) => q.eq("repair_order_id", order._id))
        .unique();
      const customer = await ctx.db.get(order.customer_id);
      const created_by = await ctx.db.get(order.created_by_user_id);
      result.push({
        ...order,
        device_brand: device?.brand,
        device_model: device?.model,
        device_type: device?.device_type,
        customer_name: customer?.name,
        customer_phone: customer?.phone,
        created_by_name: created_by?.full_name || created_by?.email,
      });
    }
    return result;
  },
});

export const getRepairDetails = query({
  args: { id: v.id("repair_orders") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    const device = await ctx.db
      .query("devices")
      .withIndex("by_repair_order_id", (q) => q.eq("repair_order_id", args.id))
      .unique();
    const customer = await ctx.db.get(order.customer_id);
    const details = await ctx.db
      .query("repair_details")
      .withIndex("by_repair_order_id", (q) => q.eq("repair_order_id", args.id))
      .unique();
    return { ...order, device, customer, details };
  },
});

export const updateRepairStatus = mutation({
  args: { id: v.id("repair_orders"), status: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, { 
      status: args.status as any,
      last_updated_by_user_id: userId
    });
    return null;
  },
});

export const completeRepair = mutation({
  args: {
    id: v.id("repair_orders"),
    diagnosis: v.string(),
    work_performed: v.string(),
    parts_used: v.array(v.object({ name: v.string(), qty: v.number(), unit_cost: v.number() })),
    labor_hours: v.number(),
    parts_cost: v.number(),
    labor_cost: v.number(),
    total_cost: v.number(),
    warranty_days: v.number(),
    technician_notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const details = await ctx.db
      .query("repair_details")
      .withIndex("by_repair_order_id", (q) => q.eq("repair_order_id", args.id))
      .unique();
    
    if (details) {
      await ctx.db.patch(details._id, {
        diagnosis: args.diagnosis,
        work_performed: args.work_performed,
        parts_used: args.parts_used,
        labor_hours: args.labor_hours,
        parts_cost: args.parts_cost,
        labor_cost: args.labor_cost,
        total_cost: args.total_cost,
        warranty_days: args.warranty_days,
        technician_notes: args.technician_notes,
        completed_at: Date.now(),
        completed_by_user_id: userId,
      });
    }

    await ctx.db.patch(args.id, { 
      status: "completed",
      last_updated_by_user_id: userId
    });

    // Email Notification
    await ctx.scheduler.runAfter(0, internal.email.sendRepairStatusEmail, {
      repairOrderId: args.id,
      status: "completed",
    });

    return null;
  },
});

export const getPublicRepairStatus = query({
  args: { ticketNumber: v.string(), phoneLast4: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("repair_orders")
      .withIndex("by_ticket_number", (q) => q.eq("ticket_number", args.ticketNumber))
      .unique();

    if (!order) return null;

    const customer = await ctx.db.get(order.customer_id);
    if (!customer) return null;

    // Verify last 4 digits of phone for basic security
    const last4 = customer.phone.replace(/\D/g, "").slice(-4);
    if (last4 !== args.phoneLast4) return null;

    const device = await ctx.db
      .query("devices")
      .withIndex("by_repair_order_id", (q) => q.eq("repair_order_id", order._id))
      .unique();

    const details = await ctx.db
      .query("repair_details")
      .withIndex("by_repair_order_id", (q) => q.eq("repair_order_id", order._id))
      .unique();

    return {
      ticket_number: order.ticket_number,
      status: order.status,
      estimated_completion_at: order.estimated_completion_at,
      device_brand: device?.brand,
      device_model: device?.model,
      device_type: device?.device_type,
      work_performed: details?.work_performed,
      total_cost: details?.total_cost,
      deposit_amount: details?.deposit_amount,
      updated_at: order._creationTime, // Simplified for now
    };
  },
});
