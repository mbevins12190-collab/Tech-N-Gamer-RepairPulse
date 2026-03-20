import { query } from "./_generated/server";
import { v } from "convex/values";

export const listTechnicians = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
