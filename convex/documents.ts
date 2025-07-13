import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { vOnCompleteArgs, Workpool } from "@convex-dev/workpool";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components, internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.documentId, {
      status: args.status,
      summary: args.summary,
      processingStartedAt: args.processingStartedAt,
    });
  },
});

export const documentClassifierAgent = new Agent(components.agent, {
  name: "Document Classifier Agent",
  instructions:
    "Your job is to classify a given document into one of the following categories: 'non-medical', 'finance', 'insurance', 'other'.",
  languageModel: openai("gpt-5"),
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

    const result = await documentClassifierAgent.generateObject(
      ctx,
      {
        userId: document?.user,
      },
      {
        schema: z.discriminatedUnion("category", [
          z.object({
            category: z.literal("non-medical"),
            summary: z.string(),
          }),
          z.object({
            category: z.literal("testresults"),
            testType: z.union([
              z.literal("bloodwork"),
              z.literal("imaging"),
              z.literal("physical"),
              z.literal("functional"),
            ]),
          }),
          z.object({
            category: z.literal("visit-summary"),
          }),
          z.object({
            category: z.literal("insurance"),
          }),
        ]),
        messages: [
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
      },
    );

    console.log(result);
  },
});

export const analyzeDocumentComplete = internalMutation({
  args: vOnCompleteArgs(v.object({ documentId: v.id("documents") })),
  handler: async (ctx, { context, result }) => {
    await ctx.db.patch(context.documentId, {
      status: result.kind === "success" ? "completed" : result.kind,
      error: result.kind === "failed" ? result.error : undefined,
      processingCompletedAt: Date.now(),
    });
  },
});
