import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getSettings = internalQuery({
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
