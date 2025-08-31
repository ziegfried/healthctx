import { openai } from "@ai-sdk/openai";
import { vOnCompleteArgs, Workpool } from "@convex-dev/workpool";
import { generateObject } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { components, internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";

const workerPool = new Workpool(components.documentProcessing, {
  maxParallelism: 10,
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

export const listDocuments = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    let userId = args.userId;

    if (!userId) {
      userId = (
        await ctx.db
          .query("users")
          .withIndex("by_identity", (q) => q.eq("identity", identity.tokenIdentifier))
          .unique()
      )?._id;
    }

    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .collect();
  },
});

export const processDocument = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    type: v.union(v.literal("pdf"), v.literal("image"), v.literal("text")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_identity", (q) => q.eq("identity", identity.tokenIdentifier))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    const id = await ctx.db.insert("documents", {
      name: args.fileName,
      user: user._id,
      data: args.storageId,
      type: args.type,
      status: "pending",
    });

    await workerPool.enqueueAction(
      ctx,
      internal.documents.analyzeDocument,
      { documentId: id },
      {
        onComplete: internal.documents.analyzeDocumentComplete,
        context: { documentId: id },
        retry: { maxAttempts: 5, initialBackoffMs: 250, base: 2 },
      },
    );

    return id;
  },
});

export const updateDocumentInfo = internalMutation({
  args: {
    documentId: v.id("documents"),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    ),
    summary: v.optional(v.string()),
    processingStartedAt: v.optional(v.number()),
    classification: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    const updates: any = {};
    if (args.status) {
      updates.status = args.status;
    }
    if (args.summary) {
      updates.summary = args.summary;
    }
    if (args.processingStartedAt) {
      updates.processingStartedAt = args.processingStartedAt;
    }
    if (args.classification) {
      updates.classification = args.classification;
    }
    if (Object.keys(updates).length === 0) {
      return;
    }
    await ctx.db.patch(args.documentId, updates);
  },
});

export const getDocument = internalQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const analyzeDocument = internalAction({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.documents.updateDocumentInfo, {
      documentId: args.documentId,
      status: "processing",
      processingStartedAt: Date.now(),
    });

    const document = await ctx.runQuery(internal.documents.getDocument, {
      documentId: args.documentId,
    });

    const documentUrl = await ctx.storage.getUrl(document?.data!);

    const result = await generateObject({
      model: openai("gpt-5-mini"),
      schema: z.object({
        classification: z.union([
          z.object({
            category: z.literal("testresults"),
            testType: z.union([
              z.literal("labs"),
              z.literal("imaging"),
              z.literal("physical"),
              z.literal("functional"),
              z.literal("other"),
            ]),
          }),
          z.object({
            category: z.literal("clinical-notes"),
            type: z.union([
              z.literal("visit-summary"),
              z.literal("discharge-instructions"),
              z.literal("prescription"),
              z.literal("referral"),
              z.literal("lab-order"),
              z.literal("medical-history"),
              z.literal("other"),
            ]),
          }),
          z.object({
            category: z.literal("insurance-document"),
          }),
          z.object({
            category: z.literal("non-medical"),
            explanation: z.string().describe("brief sentence on why this is not a medical document. keep it short."),
          }),
        ]),
      }),
      messages: [
        {
          role: "system",
          content:
            "You are a document classifier. You are given a document and you need to classify it into one of the categories listed in the output schema. If the document does not fit into any of the categories, return the category 'non-medical'.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Classify the attached document" },
            {
              type: "file",
              data: new URL(documentUrl!),
              mediaType: document?.type === "pdf" ? "application/pdf" : "image/jpeg",
            },
          ],
        },
      ],
    });

    await ctx.runMutation(internal.documents.updateDocumentInfo, {
      documentId: args.documentId,
      classification: result.object?.classification,
    });
  },
});

export const analyzeDocumentComplete = internalMutation({
  args: vOnCompleteArgs(v.object({ documentId: v.id("documents") })),
  handler: async (ctx, { context, result }) => {
    console.log("COMPLETE");
    await ctx.db.patch(context.documentId, {
      status: result.kind === "success" ? "completed" : result.kind,
      error: result.kind === "failed" ? result.error : undefined,
      processingCompletedAt: Date.now(),
    });
  },
});
