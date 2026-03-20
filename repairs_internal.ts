import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getOrderDetails = internalQuery({
  args: { repairOrderId: v.id("repair_orders") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.repairOrderId);
    if (!order) return null;

    const device = await ctx.db
      .query("devices")
      .withIndex("by_repair_order_id", (q) => q.eq("repair_order_id", args.repairOrderId))
      .unique();
    
    const customer = await ctx.db.get(order.customer_id);
    const details = await ctx.db
      .query("repair_details")
      .withIndex("by_repair_order_id", (q) => q.eq("repair_order_id", args.repairOrderId))
      .unique();

    return {
      ...order,
      device_brand: device?.brand,
      device_model: device?.model,
      device_type: device?.device_type,
      device_serial: device?.serial_number,
      device_issue: device?.reported_issue,
      customer_name: customer?.name,
      customer_phone: customer?.phone,
      customer_email: customer?.email,
      total_cost: details?.total_cost || 0,
      deposit_amount: details?.deposit_amount || 0,
      parts_cost: details?.parts_cost || 0,
      labor_cost: details?.labor_cost || 0,
      work_performed: details?.work_performed || "",
      diagnosis: details?.diagnosis || "",
      parts_used: details?.parts_used || [],
    };
  },
});
