import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const searchCustomers = query({
  args: { query: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];
    // Basic search on name or phone
    const customers = await ctx.db.query("customers").collect();
    return customers.filter(c => 
      c.name.toLowerCase().includes(args.query.toLowerCase()) || 
      c.phone.includes(args.query)
    ).slice(0, 5);
  },
});

export const createRepair = mutation({
  args: {
    customer: v.object({
      id: v.optional(v.id("customers")),
      name: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
    }),
    device: v.object({
      device_type: v.string(),
      brand: v.string(),
      model: v.string(),
      serial_number: v.optional(v.string()),
      condition_notes: v.optional(v.string()),
      reported_issue: v.string(),
      accessories_left: v.array(v.string()),
    }),
    order: v.object({
      urgency: v.union(v.literal("Normal"), v.literal("Rush")),
      estimated_completion_at: v.optional(v.number()),
      deposit_amount: v.number(),
      deposit_method: v.optional(v.string()),
      assigned_tech_id: v.optional(v.id("users")),
    }),
  },
  returns: v.object({
    orderId: v.id("repair_orders"),
    ticketNumber: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 1. Handle Customer
    let customerId = args.customer.id;
    if (!customerId) {
      // Check if exists by phone
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_phone", (q) => q.eq("phone", args.customer.phone))
        .unique();
      if (existing) {
        customerId = existing._id;
        await ctx.db.patch(customerId, {
          name: args.customer.name,
          email: args.customer.email,
          address: args.customer.address,
        });
      } else {
        customerId = await ctx.db.insert("customers", {
          name: args.customer.name,
          phone: args.customer.phone,
          email: args.customer.email,
          address: args.customer.address,
        });
      }
    }

    // 2. Generate Ticket Number (RO-YYYY-NNNNN)
    const now = new Date();
    const year = now.getFullYear();
    const count = (await ctx.db.query("repair_orders").collect()).length + 1;
    const ticketNumber = `RO-${year}-${count.toString().padStart(5, "0")}`;
    const barcodeValue = crypto.randomUUID();

    // 3. Create Repair Order
    const orderId = await ctx.db.insert("repair_orders", {
      ticket_number: ticketNumber,
      barcode_value: barcodeValue,
      customer_id: customerId,
      status: "intake",
      created_by_user_id: userId,
      last_updated_by_user_id: userId,
      estimated_completion_at: args.order.estimated_completion_at,
      urgency: args.order.urgency,
    });

    // 4. Create Device
    await ctx.db.insert("devices", {
      repair_order_id: orderId,
      ...args.device,
    });

    // 5. Create Repair Details (initial)
    await ctx.db.insert("repair_details", {
      repair_order_id: orderId,
      parts_used: [],
      parts_cost: 0,
      labor_cost: 0,
      total_cost: 0,
      deposit_amount: args.order.deposit_amount,
      deposit_method: args.order.deposit_method,
    });

    // 6. Audit Log
    await ctx.db.insert("audit_log", {
      user_id: userId,
      action: "CREATE",
      table_name: "repair_orders",
      record_id: orderId,
    });

    // 7. Email Notification
    if (args.customer.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendRepairStatusEmail, {
        repairOrderId: orderId,
        status: "created",
      });
    }

    return { orderId, ticketNumber };
  },
});
