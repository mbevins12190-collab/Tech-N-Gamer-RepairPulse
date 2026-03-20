import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  returns: v.union(v.null(), v.id("users")),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

export const currentUserData = query({
  args: {},
  returns: v.any(), // Keeping it simple for now
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const anyUsersExist = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await ctx.db.query("users").first();
    return user !== null;
  },
});

export const finalizeUser = mutation({
  args: {
    full_name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const isFirstUser = (await ctx.db.query("users").collect()).length === 1;

    await ctx.db.patch(userId, {
      full_name: args.full_name || user.full_name,
      role: isFirstUser ? "admin" : "technician",
      is_active: true,
    });

    return null;
  },
});
