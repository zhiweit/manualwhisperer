import { openai } from "@ai-sdk/openai";
import {
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { redirect } from "@solidjs/router";
import { convertToCoreMessages, streamText } from "ai";
import { desc, eq } from "drizzle-orm";
import { Message, MessageType } from "~/api/types";
import { db } from "~/db/drizzle";
import { threadTable } from "~/db/schema";
import { ROUTE_LOGIN } from "~/lib/route";
import { app } from "~/rag/main";
import { getSessionUserId } from "../user/auth";
import { createId } from "~/db/utils";

type ConvertibleMessage = Parameters<typeof convertToCoreMessages>[0][number];

export const getChatCompletion = async (params: {
  messages: ConvertibleMessage[];
}) => {
  "use server";
  // Call the language model
  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages: convertToCoreMessages(params.messages),
    async onFinish({ text, toolCalls, toolResults, usage, finishReason }) {
      // implement your own logic here, e.g. for storing messages
      // or recording token usage
      console.log("on finish", {
        text,
        toolCalls,
        toolResults,
        usage,
        finishReason,
      });
    },
  });

  // Respond with the stream
  return result.toDataStreamResponse();
};

export const getThreadMessages = async (threadId?: string) => {
  "use server";
  if (!threadId) {
    return { messages: [] };
  }
  const config = {
    configurable: { thread_id: threadId },
  };
  const state = await app.getState(config);
  const stateMessages = state.values.messages as BaseMessage[];
  const filteredMessages = stateMessages.filter((message: BaseMessage) => {
    if (message instanceof HumanMessage) {
      return true;
    } else if (message instanceof AIMessageChunk) {
      return message.content !== ""; // filter out tool calls
    }
    return false; // filter out other messages e.g. ToolMessage
  });

  const messages: Message[] = filteredMessages.map((message: BaseMessage) => {
    // defaults for HumanMessage
    let type: MessageType = MessageType.HumanMessage;
    // let toolCalls: ToolCall[] | undefined = undefined;
    let id = createId("msg"); // id for human message

    if (message instanceof AIMessageChunk && message.content) {
      type = MessageType.AIMessageChunk;
      id = message.id as string;

      // tool calls if want to show in UI in the future
      //   if (
      //     "tool_calls" in message &&
      //     Array.isArray(message.tool_calls) &&
      //     message.tool_calls.length
      //   ) {
      //     // id
      //     toolCalls = message.tool_calls;
      // }
      // } else if (message instanceof ToolMessage) {
      //   type = MessageType.ToolMessage;
    }

    const res: Message = {
      id,
      type,
      content: message.content,
      // toolCalls,
    };

    return res;
  });
  return { messages };
};

export const getUserThreads = async () => {
  "use server";
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect(ROUTE_LOGIN);
  }

  const threads = await db
    .select()
    .from(threadTable)
    .where(eq(threadTable.userId, userId))
    .orderBy(desc(threadTable.updatedAt));

  return threads;
};
