import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSettings = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").collect();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  },
});

export const updateSettings = mutation({
  args: {
    shop_name: v.string(),
    shop_phone: v.string(),
    shop_address: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const keys = ["shop_name", "shop_phone", "shop_address"] as const;
    for (const key of keys) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { value: args[key] });
      } else {
        await ctx.db.insert("settings", { key, value: args[key] });
      }
    }
    return null;
  },
});
