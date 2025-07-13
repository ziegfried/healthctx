import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    identity: v.string(),
  }).index("by_identity", ["identity"]),

  healthProfiles: defineTable({
    user: v.id("users"),
    dob: v.optional(v.string()),
    gender: v.optional(v.string()),
    height: v.optional(v.number()),
  }).index("by_user", ["user"]),

  documents: defineTable({
    name: v.string(),
    user: v.id("users"),
    data: v.id("_storage"),
    summary: v.optional(v.string()),
    type: v.union(v.literal("pdf"), v.literal("image"), v.literal("text")),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("canceled"),
    ),
    error: v.optional(v.string()),
    processingStartedAt: v.optional(v.number()),
    processingCompletedAt: v.optional(v.number()),
  })
    .index("by_user", ["user"])
    .index("by_status", ["user", "status"]),

  testResults: defineTable({
    document: v.union(v.id("documents"), v.null()),
    kind: v.union(v.literal("imaging"), v.literal("bloodwork"), v.literal("physical"), v.literal("functional")),
    result: v.string(),
    summary: v.string(),
    performedAt: v.string(),
    reportedAt: v.optional(v.string()),
    user: v.id("users"),
  })
    .index("by_document", ["document"])
    .index("by_user", ["user"]),

  measurements: defineTable({
    user: v.id("users"),
    testResult: v.optional(v.id("testResults")),
    kind: v.union(v.literal("bloodwork"), v.literal("vital")),
    name: v.string(),
    value: v.string(),
    unit: v.string(),
    referenceRange: v.optional(v.string()),
    measuredAt: v.string(),
  })
    .index("by_user", ["user"])
    .index("by_testresult", ["testResult"]),
});
