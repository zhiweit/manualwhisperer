import type { MessageContent } from "@langchain/core/messages";
import { action, useNavigate, useParams, useSubmission } from "@solidjs/router";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  onCleanup,
  Show,
  Switch,
  untrack,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import {
  threadMessagesQueryOpts,
  userThreadsQueryOpts,
} from "~/api/chat/query";
import { getThreadMessages } from "~/api/chat/rpc";
import {
  MessageType,
  type CompletionEventData,
  type Message,
} from "~/api/types";
import { ArtificialIntelligence } from "~/components/icons/ArtificialIntelligence";
import { EnterIcon } from "~/components/icons/EnterIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { createMessageId } from "~/db/utils";
import { streamEventSource } from "~/lib/eventsource";
import { renderMarkdownToHtml } from "~/lib/markdown";
import { cn } from "~/lib/utils";

const getCompletion = async (params: {
  question: string;
  threadId?: string;
  model?: string;
}) => {
  const stream = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  return stream;
};

const loadingMessages = [
  { text: "Processing request...", delay: 0 },
  { text: "Searching knowledge base...", delay: 3000 },
  { text: "Looking through the manual...", delay: 6000 },
  { text: "Retrieving...", delay: 9000 },
  { text: "Taking longer than expected...", delay: 50000 },
];

function TypewriterText(props: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = createSignal("");
  const [showCursor, setShowCursor] = createSignal(true);

  createEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= props.text.length) {
        setDisplayText(props.text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, props.speed || 50);

    // Blinking cursor effect
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 1000);

    onCleanup(() => {
      clearInterval(timer);
      clearInterval(cursorTimer);
    });
  });

  return (
    <span>
      {displayText()}
      <span
        class={`${showCursor() ? "opacity-100" : "opacity-0"} transition-opacity`}
      >
        |
      </span>
    </span>
  );
}

export function Chat() {
  const navigate = useNavigate();
  const params = useParams<{ threadId?: string; model?: string }>();
  const threadId = createMemo(() => params.threadId);

  const queryClient = useQueryClient();
  // TODO: remove id when its added actual
  const [messages, setMessages] = createStore<
    (Message & { id?: string; preventScroll?: boolean })[]
  >([]);
  const history = createQuery(() =>
    threadMessagesQueryOpts({ id: threadId() })
  );
  const isNewThreadForm = createMemo(
    () => !threadId() && messages.length === 0
  );

  let messagesContainerRef: HTMLDivElement;

  const scrollToBottom = () => {
    if (messagesContainerRef) {
      messagesContainerRef.scrollTo({
        top: messagesContainerRef.scrollHeight,
        behavior: "instant", // Use instant to prevent visual jumps when loading threads
      });
    }
  };

  createEffect(() => {
    // Reset messages whenever thread changes
    const id = threadId();
    if (!id) {
      setMessages([]);
      return;
    }

    async function fetchThreadMessages() {
      const res = await getThreadMessages(id);

      // Ensure the thread wasnt changed while fetching
      if (untrack(threadId) !== id) {
        return;
      }

      // Load messages from history
      console.log("thread effect", res);
      setMessages(res?.messages ?? []);
      const messageCount = res?.messages?.length || 0;
      // Immediately scroll to bottom when loading a new thread
      if (messagesContainerRef && messageCount > 0) {
        // Use RAF to ensure DOM is updated before scrolling
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }
    fetchThreadMessages();
  });

  const [loadingIndex, setLoadingIndex] = createSignal(0);

  const submitQuestion = action(async (formData: FormData) => {
    // Reset loading index at start of each request
    setLoadingIndex(0);

    // Start rotating messages
    const intervalId = setInterval(() => {
      setLoadingIndex((i) => {
        // Stop at the last message instead of looping
        return i < loadingMessages.length - 1 ? i + 1 : i;
      });
    }, 3000); // Change message every 2 seconds

    const threadId = String(formData.get("threadId"));
    const question = String(formData.get("question"));
    const model = String(formData.get("model"));
    setMessages(
      produce((messages) => {
        messages.push({
          id: createMessageId(),
          content: question,
          type: MessageType.HumanMessage,
        });
        messages.push({
          id: createMessageId(),
          content: loadingMessages[0].text,
          type: MessageType.AIMessageChunk,
        });
      })
    );

    // Update the loading message
    const loadingUpdateInterval = setInterval(() => {
      setMessages(
        produce((messages) => {
          messages[messages.length - 1].content =
            loadingMessages[loadingIndex()].text;
        })
      );
    }, 100);

    const response = await getCompletion({ question, threadId, model });

    // Clear intervals when response is received
    clearInterval(intervalId);
    clearInterval(loadingUpdateInterval);

    if (!response.ok) {
      // Revert
      setMessages(
        produce((messages) => {
          messages.pop();
          messages.pop();
        })
      );
      throw new Error("Failed to get completion");
    }

    if (!response.body) {
      // Revert
      setMessages(
        produce((messages) => {
          messages.pop();
          messages.pop();
        })
      );
      throw new Error("No response body");
    }

    // Clear input for sent message
    inputRef.value = "";

    console.log("starting stream");
    let finalContent = "";
    let msgIndex: number | undefined;
    for await (const msg of streamEventSource(response.body)) {
      if (msg.event !== "response") {
        console.warn("skipping non-response event", msg);
        continue;
      }
      const data = JSON.parse(msg.data) as CompletionEventData;
      // TODO: Handle other SSE events
      finalContent = data.message;

      if (params.threadId !== data.threadId) {
        navigate(`/chat/c/${data.threadId}`, {
          resolve: false,
        });
      }

      // Store current scroll position
      const currentScroll = messagesContainerRef.scrollTop;
      const currentHeight = messagesContainerRef.scrollHeight;

      // Capture the message index
      if (msgIndex === undefined) {
        msgIndex = messages.length - 1;
      }

      console.log("streaming", data.message, messages);
      setMessages(msgIndex, {
        content: data.message,
        type: MessageType.AIMessageChunk,
      });

      // Maintain scroll position relative to bottom
      requestAnimationFrame(() => {
        const newHeight = messagesContainerRef.scrollHeight;
        const heightDiff = newHeight - currentHeight;
        messagesContainerRef.scrollTop = currentScroll + heightDiff;
      });
    }

    // After streaming, add a new complete message
    const finalScroll = messagesContainerRef.scrollTop;
    const finalHeight = messagesContainerRef.scrollHeight;

    // Remove the streaming message and add the complete one
    // To fix when streaming message is not visible
    console.log("finalContent", finalContent, messages);
    if (msgIndex !== undefined) {
      setMessages(msgIndex, {
        id: createMessageId(),
        content: finalContent,
        type: MessageType.AIMessage,
      });
    }

    // Maintain scroll position
    requestAnimationFrame(() => {
      const newHeight = messagesContainerRef.scrollHeight;
      const heightDiff = newHeight - finalHeight;
      messagesContainerRef.scrollTop = finalScroll + heightDiff;
    });

    // After streaming completes
    console.log("Streaming completed, refreshing queries");

    // Force an immediate refetch of the threads list
    await queryClient.invalidateQueries({
      queryKey: userThreadsQueryOpts().queryKey,
      exact: true,
    });

    await queryClient.refetchQueries({
      queryKey: userThreadsQueryOpts().queryKey,
      exact: true,
    });

    console.log("Queries refreshed");

    // Invalidate current thread messages if we have a threadId
    if (params.threadId) {
      queryClient.invalidateQueries({
        queryKey: threadMessagesQueryOpts({ id: params.threadId }).queryKey,
        exact: true,
      });
    }

    // Refocus input
    inputRef.focus();
  }, "submit-question");

  const submit = useSubmission(submitQuestion);
  let inputRef: HTMLInputElement;

  // Auto-scroll effect when messages change
  createEffect(() => {
    // const messagesLength = messages.length; // Track length changes without lint error
    if (messagesContainerRef) {
      const isAtBottom =
        messagesContainerRef.scrollHeight - messagesContainerRef.scrollTop <=
        messagesContainerRef.clientHeight + 100;

      // Only auto-scroll if user is already near the bottom
      if (isAtBottom) {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }
  });

  // Track streaming updates
  createEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage?.content &&
      lastMessage.type === MessageType.AIMessageChunk
    ) {
      // Only scroll if the message doesn't have preventScroll flag
      if (!lastMessage.preventScroll) {
        scrollToBottom();
      }
    }
  });

  const [inputValue, setInputValue] = createSignal("");
  const [selectedModel, setSelectedModel] = createSignal(
    params.model ?? "Model A"
  );

  return (
    <div class="flex flex-col w-full mx-auto max-w-2xl gap-6 relative flex-1 h-full">
      <div class="sticky top-0 z-10 pointer-events-none">
        <div class="h-8 bg-gradient-to-b from-white via-30% via-white/80 to-transparent" />
      </div>

      <div
        ref={(el) => {
          messagesContainerRef = el;
          if (el && messages.length > 0) {
            // Ensure we start at bottom when component mounts
            scrollToBottom();
          }
        }}
        class={cn("px-4 flex flex-col flex-1 gap-4 pb-12 overflow-y-auto", {
          hidden: isNewThreadForm(),
        })}
        style={{
          "max-height": "calc(100vh - 244px)",
          "min-height": "300px",
          "scroll-behavior": "auto",
        }}
      >
        <For each={messages}>{(msg) => <ThreadMessage message={msg} />}</For>
      </div>

      <form
        action={submitQuestion}
        method="post"
        class={cn({
          "flex items-center flex-col justify-center flex-1 mb-32":
            isNewThreadForm(),
        })}
      >
        <input type="hidden" name="threadId" value={threadId() ?? ""} />
        <Show when={isNewThreadForm()}>
          <h1 class="text-3xl font-semibold text-center">
            <TypewriterText text="What can I help with?" />
          </h1>
        </Show>
        <div
          class={cn("px-4 flex flex-col w-full mx-auto", {
            "fixed bottom-0": !isNewThreadForm(),
            "mt-8": isNewThreadForm(),
          })}
        >
          <input type="hidden" name="model" value={selectedModel()} />
          <div class="flex flex-col w-full max-w-2xl mb-8">
            <div class="flex flex-col bg-gray-200/50 rounded-3xl">
              <div class="flex items-center">
                <input
                  autofocus
                  ref={(el) => (inputRef = el)}
                  onInput={(e) => setInputValue(e.currentTarget.value)}
                  class="flex-1 px-4 h-[52px] bg-transparent rounded-3xl text-gray-900 placeholder:text-gray-500 disabled:text-gray-500 disabled:cursor-wait focus:outline-none"
                  name="question"
                  placeholder="Say something..."
                  disabled={submit.pending}
                />
                <Show when={inputValue().trim()}>
                  <EnterIcon class="size-5 text-gray-500 hover:text-gray-900 mr-4 shrink-0 cursor-pointer transition-colors" />
                </Show>
              </div>
              <div class="w-full">
                <Select
                  value={selectedModel()}
                  onChange={(value) => {
                    setSelectedModel(value ?? "Model A"); // Provide a default value if value is null
                  }}
                  options={["Model A", "Model B"]}
                  placeholder="Select Model"
                  itemComponent={(props) => (
                    <SelectItem
                      item={props.item}
                      class="focus:outline-none hover:bg-gray-100 text-base"
                    >
                      {props.item.rawValue === "Model A"
                        ? "FANUC Series Model A"
                        : "FANUC Series Model B"}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger
                    name="model"
                    class="w-full px-4 py-3 text-gray-600 bg-transparent disabled:text-gray-500 disabled:cursor-wait text-base h-12"
                  >
                    <SelectValue>
                      {(state) =>
                        state.selectedOption() === "Model A"
                          ? "FANUC Series Model A"
                          : "FANUC Series Model B"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent class="focus:outline-none" />
                </Select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function ThreadMessage(props: { message: Message }) {
  return (
    <Switch>
      <Match when={props.message.type === MessageType.HumanMessage}>
        <div class="ml-auto rounded-3xl px-3 py-2.5 bg-gray-200 text-gray-700">
          <MessageContentDisplay content={props.message.content} />
        </div>
      </Match>

      <Match when={props.message.type === MessageType.AIMessageChunk}>
        <div class="flex items-start gap-4">
          <ArtificialIntelligence class="size-8 text-gray-500 shrink-0" />
          <div class="pt-1 text-gray-600">
            <MessageContentDisplay content={props.message.content} />
          </div>
        </div>
      </Match>
      <Match when={props.message.type === MessageType.AIMessage}>
        <div class="flex items-start gap-4">
          <ArtificialIntelligence class="size-8 text-gray-500 shrink-0" />
          <div class="pt-1 text-gray-600">
            <MessageContentDisplay content={props.message.content} />
          </div>
        </div>
      </Match>
    </Switch>
  );
}

function MessageContentDisplay(props: { content: MessageContent }) {
  return (
    <Switch>
      <Match when={((x) => typeof x === "string" && x)(props.content)}>
        {/* TODO: Add tailwind typography + md renderer */}
        {(content) => {
          const [mdContent] = createResource(
            content,
            (content) => renderMarkdownToHtml(content),
            {
              initialValue: content(),
            }
          );

          // eslint-disable-next-line solid/no-innerhtml
          return <div class="prose" innerHTML={mdContent()} />;
        }}
      </Match>
      <Match when={Array.isArray(props.content) && props.content}>
        {(contents) => (
          <For each={contents()}>
            {(content) => (
              <Switch fallback={<div>Unknown content type</div>}>
                <Match when={content.type === "text" && content}>
                  {(content) => <div>{content().text}</div>}
                </Match>
                <Match when={content.type === "image_url" && content}>
                  {(content) => <img src={content().image_url} />}
                </Match>
                <Match when={content.type === "image_url" && content}>
                  {(content) => (
                    <img
                      src={
                        typeof content().image_url === "string"
                          ? content().image_url
                          : content().image_url.url
                      }
                    />
                  )}
                </Match>
              </Switch>
            )}
          </For>
        )}
      </Match>
    </Switch>
  );
}
