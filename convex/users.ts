import { mutation } from "./_generated/server";

export const ensureUser = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_identity", (q) => q.eq("identity", identity.tokenIdentifier))
      .first();
    if (!user) {
      return await ctx.db.insert("users", {
        identity: identity.tokenIdentifier,
        name: identity.name ?? "Unknown",
      });
    }
    return user._id;
  },
});
