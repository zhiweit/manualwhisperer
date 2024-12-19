import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { APIEvent } from "@solidjs/start/server";
import { and, eq } from "drizzle-orm";
import { CompletionEventData } from "~/api/types";
import { getSessionUserId } from "~/api/user/auth";
import { db } from "~/db/drizzle";
import { threadTable } from "~/db/schema";
import { createThreadId } from "~/db/utils";
import { app } from "~/rag/main";
import { model } from "~/rag/base";

const encoder = new TextEncoder();

/** Chain to summarise thread name from the question */
const summariseQuestionPrompt = ChatPromptTemplate.fromTemplate(
  "Summarise the question into a phrase: {question} and do not respond with quotation marks."
);
const summariseQuestionChain = summariseQuestionPrompt
  .pipe(model)
  .pipe(new StringOutputParser());

export async function POST(req: APIEvent) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const reqBody = await req.request.json();
  const question: string = reqBody.question;
  const model: string = reqBody.model ?? "Model A";
  console.log(`model: ${model} question: ${question}`);
  let threadId: string = reqBody.threadId;
  let isNewThread = false;
  if (!threadId) {
    threadId = createThreadId(); // new conversation if threadId is not provided
    isNewThread = true;
  }

  const state = {
    messages: [new HumanMessage(question)],
  };

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Encoding": "none",
  });

  const readableStream = new ReadableStream({
    start(controller) {
      const messageContent: string[] = [];

      const streamEvents = async () => {
        for await (const event of app.streamEvents(state, {
          version: "v2",
          configurable: {
            thread_id: threadId,
            model: model,
          },
        })) {
          if (event.event == "on_chat_model_stream" && "chunk" in event.data) {
            const chunk = event.data.chunk as AIMessageChunk;
            if (chunk.content) {
              // console.log(chunk.content + "|");
              messageContent.push(chunk.content as string);
              const sseData: CompletionEventData = {
                threadId: threadId,
                messageId: chunk.id as string,
                message: messageContent.join(""),
              };
              const sse = encoder.encode(
                `event: response\ndata: ${JSON.stringify(sseData)}\n\n`
              );
              controller.enqueue(sse);
            }
          } else if (
            event.event == "on_chain_end" &&
            event.name == "LangGraph"
          ) {
            // if userId present and threadId not present => first time chatting => insert the thread to db
            if (userId) {
              if (isNewThread) {
                // generate a name for the thread based on the question
                const threadName = await summariseQuestionChain.invoke({
                  question: question,
                });
                await db
                  .insert(threadTable)
                  .values({ id: threadId, userId, name: threadName });
              }

              await db
                .update(threadTable)
                .set({ updatedAt: new Date() })
                .where(
                  and(
                    eq(threadTable.id, threadId),
                    eq(threadTable.userId, userId)
                  )
                );
            }
            controller.close();
          }
        }
      };

      streamEvents();
    },
    cancel() {
      console.log("Stream cancelled");
    },
  });

  return new Response(readableStream, { headers });
}
