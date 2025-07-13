import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { type ActionCtx, internalAction, type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";

export const chatAgent = new Agent(components.agent, {
  name: "Chat Agent",
  languageModel: openai("gpt-5"),
  instructions: "You are a helpful assistant that can answer questions and help with tasks.",
});

export const createThread = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const thread = await chatAgent.createThread(ctx, { userId: identity.tokenIdentifier });
    return thread.threadId;
  },
});

export const sendMessage = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await chatAgent.saveMessage(ctx, {
      threadId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.chat.generateResponse, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

export const generateResponse = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    const { thread } = await chatAgent.continueThread(ctx, { threadId });
    await thread.generateText({ promptMessageId });
  },
});

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { threadId, paginationOpts } = args;
    await authorizeThreadAccess(ctx, threadId);
    const messages = await chatAgent.listMessages(ctx, {
      threadId,
      paginationOpts,
    });
    return messages;
  },
});

async function authorizeThreadAccess(ctx: QueryCtx | MutationCtx | ActionCtx, threadId: string) {
  const user = await ctx.auth.getUserIdentity();
  const userId = user?.tokenIdentifier;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  if (!threadId) {
    throw new Error(`Thread not found: ${threadId}`);
  }
  const thread = await chatAgent.getThreadMetadata(ctx, { threadId });
  if (thread.userId !== userId) {
    console.log("Unauthorized", thread.userId, userId);
    throw new Error("Unauthorized");
  }
}
