import { Dialog } from "@kobalte/core";
import { isHydrated } from "@solid-primitives/lifecycle";
import { A, createAsync, RouteSectionProps, useParams } from "@solidjs/router";
import { createQuery } from "@tanstack/solid-query";
import {
  createSignal,
  For,
  Show,
  Suspense,
  createEffect,
  createMemo,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { userThreadsQueryOpts } from "~/api/chat/query";
import { getUser } from "~/api/user/rpc";
import { NewChatIcon } from "~/components/icons/NewChatIcon";
import { LayoutDashboard } from "~/components/icons/LayoutDashboard";
import { SidebarIcon } from "~/components/icons/SidebarIcon";
import { MessagesSquare } from "~/components/icons/MessagesSquare";
import { AvatarIcon } from "~/components/icons/AvatarIcon";
import type { Thread } from "~/db/schema";
import { useBreakpoint } from "~/lib/device";
import { cn } from "~/lib/utils";
import { Chat } from "./(chat)/components/Chat";

const SIDEBAR_WIDTH = 256;

// Bug with forceMount doesn't remove style from body
function resetBody() {
  setTimeout(() => {
    document.body.style.overflow = "auto";
    document.body.style.pointerEvents = "auto";
  }, 1);
}

export default function ChatLayout(props: RouteSectionProps<unknown>) {
  const user = createAsync(() => getUser(), { deferStream: true });

  const bp = useBreakpoint();
  const isMobile = () => !bp.md;
  const [sidebarOpen, setSidebarOpen] = createSignal(
    // Client-side use bp, server-side use true
    isHydrated() ? !isMobile() : true
  );

  function handleClickChat() {
    if (isMobile()) {
      setSidebarOpen(false);
    }
    resetBody();
  }

  function createChat() {
    handleClickChat();
  }

  function handleClose() {
    setSidebarOpen(false);
    resetBody();
  }

  return (
    <div class="flex flex-col h-svh overflow-hidden">
      <div class="sticky top-0 z-10 px-4 py-2.5 flex items-center gap-2">
        <button
          type="button"
          class="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          onClick={() => setSidebarOpen((current) => !current)}
        >
          <SidebarIcon class="size-5 shrink-0" title="Open sidebar" />
        </button>
        <A
          class="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          href="/"
        >
          <NewChatIcon class="size-5 shrink-0" />
        </A>
      </div>
      <Show
        when={bp.md}
        fallback={
          <Dialog.Root
            open={sidebarOpen()}
            onOpenChange={(open) => {
              setSidebarOpen(open);
              if (open === false) {
                resetBody();
              }
            }}
            forceMount
          >
            <Dialog.Portal>
              <Dialog.Overlay
                class={cn(
                  "fixed inset-0 bg-white/50 z-40 transition-all duration-300 ease-in-out",
                  sidebarOpen() ? "opacity-100" : "opacity-0 hidden"
                )}
              />
              <Dialog.Content>
                <ChatSidebar
                  isOpen={sidebarOpen()}
                  isMobile={isMobile()}
                  onCreateChat={createChat}
                  onClickChat={handleClickChat}
                  onClose={handleClose}
                  dialog
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        }
      >
        <ChatSidebar
          isOpen={sidebarOpen()}
          isMobile={false}
          onCreateChat={createChat}
          onClickChat={handleClickChat}
          onClose={handleClose}
        />
      </Show>
      <div
        class="flex flex-col flex-1 transition-all duration-300 overflow-auto"
        style={{
          "margin-left": bp.md && sidebarOpen() ? `${SIDEBAR_WIDTH}px` : 0,
        }}
      >
        <div class="flex-1 relative">
          <Suspense>
            <Show when={user()}>
              <>
                {props.children}
                <Chat />
              </>
            </Show>
          </Suspense>
        </div>

        <ChatFooter />
      </div>
    </div>
  );
}

function ChatSidebar(props: {
  isOpen: boolean;
  isMobile: boolean;
  dialog?: boolean;
  onCreateChat: () => void;
  onClickChat: () => void;
  onClose: () => void;
}) {
  return (
    <nav
      class={cn(
        "bg-gray-100 w-full h-full overflow-y-auto flex flex-col fixed top-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        props.isOpen ? "translate-x-0" : "-translate-x-full",
        props.isMobile &&
          "bg-white border-r border-gray-200 shadow-sm shadow-gray-200"
      )}
      style={{
        "max-width": `${SIDEBAR_WIDTH}px`,
      }}
    >
      <div class="sticky top-0 z-10 px-4 py-2.5 flex justify-between items-center">
        <Dynamic
          component={props.dialog ? Dialog.CloseButton : "div"}
          type="button"
          class="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          onClick={props.dialog ? undefined : props.onClose}
        >
          <SidebarIcon class="size-5 shrink-0" title="Close sidebar" />
        </Dynamic>
        <A
          class="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          href="/"
        >
          <NewChatIcon class="size-5 shrink-0" />
        </A>
      </div>

      <div class="flex flex-col gap-0.5 px-2 mb-8">
        <A
          href="/dashboard"
          class="flex items-center gap-2 px-4 py-2 rounded text-gray-600 hover:bg-gray-200 transition hover:text-gray-900 font-medium"
        >
          <LayoutDashboard class="size-5 shrink-0" /> Dashboard
        </A>
        <A
          class="flex items-center gap-2 px-4 py-2 rounded text-gray-600 hover:bg-gray-200 transition hover:text-gray-900 font-medium"
          href="/"
        >
          <NewChatIcon class="size-5 shrink-0" /> New chat
        </A>
      </div>

      <h2 class="sr-only">Chat History</h2>

      <ThreadHistory onClickChat={props.onClickChat} />

      <div class="p-4 border-t">
        <UserProfile />
      </div>
    </nav>
  );
}

function ChatFooter() {
  // TODO: Footer
  return <footer>&nbsp;</footer>;
}

function UserProfile() {
  const user = createAsync(() => getUser(), { deferStream: true });
  return (
    <Suspense fallback={<div>...</div>}>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2 text-sm text-gray-600/90 font-semibold">
          <AvatarIcon class="size-5 shrink-0" />
          {user()?.role === "admin" ? "Admin" : "User"}
        </div>
        <div class="text-xs text-gray-500">
          You are logged in as{" "}
          {user()?.role === "admin" ? "Administrator" : "User"}
        </div>
      </div>
    </Suspense>
  );
}

function ThreadHistory(props: { onClickChat: () => void }) {
  const threads = createQuery(() => userThreadsQueryOpts());
  const [previousThreads, setPreviousThreads] = createSignal<string[]>([]);
  const [newThreadId, setNewThreadId] = createSignal<string | null>(null);

  // Track when new threads are added
  createEffect(() => {
    if (threads.data) {
      const currentThreadIds = threads.data.map((t) => t.id);
      const prevThreadIds = previousThreads();
      
      // Only consider it new if we had previous threads and this is a new one
      if (prevThreadIds.length > 0) {
        const newThreads = currentThreadIds.filter((id) => !prevThreadIds.includes(id));
        if (newThreads.length > 0) {
          setNewThreadId(newThreads[0]);
          // Clear the effect after animation
          setTimeout(() => setNewThreadId(null), 2000);
        }
      }
      
      // Update previous threads list
      setPreviousThreads(currentThreadIds);
    }
  });

  return (
    <div class="flex-1 flex flex-col gap-4">
      <Suspense
        fallback={
          <h3 class="mx-4 text-sm text-gray-700 mb-2 text-center">
            Loading history...
          </h3>
        }
      >
        <Show
          when={threads.data}
          fallback={
            <h3 class="mx-4 text-sm text-gray-700 mb-2 text-center">
              Could not load history
            </h3>
          }
        >
          {(threadsData) => {
            const grouped = createMemo(() => groupThreadsByDate(threadsData()));
            return (
              <For each={grouped()}>
                {(group) => (
                  <div>
                    <h3 class="mx-4 text-xs text-gray-700 mb-2">
                      {group.label}
                    </h3>

                    <div class="flex flex-col overflow-y-auto px-2 overflow-hidden">
                      <For each={group.threads}>
                        {(thread) => {
                          const isNewThread = thread.id === newThreadId();
                          return (
                            <A
                              href={`/chat/c/${thread.id}`}
                              class="flex py-2 px-2 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition text-sm font-medium line-clamp-1 truncate items-center gap-2"
                              onClick={() => props.onClickChat()}
                            >
                              <MessagesSquare class="size-4 shrink-0" />
                              <span class="truncate">
                                {isNewThread ? (
                                  <span class="typewriter-text">
                                    <For each={thread.name.split('')}>
                                      {(char, i) => (
                                        <span
                                          style={{
                                            'animation': `typewriter 50ms ${i() * 50}ms forwards`,
                                            'opacity': '0',
                                            'display': 'inline-block',
                                            'white-space': 'pre'
                                          }}
                                        >
                                          {char}
                                        </span>
                                      )}
                                    </For>
                                  </span>
                                ) : (
                                  thread.name
                                )}
                              </span>
                            </A>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            );
          }}
        </Show>
      </Suspense>
    </div>
  );
}

// Add the necessary CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes typewriter {
    to {
      opacity: 1;
    }
  }

  .typewriter-text {
    display: inline-block;
    position: relative;
  }
`;
document.head.appendChild(style);

function groupThreadsByDate(threads: Thread[]) {
  const now = new Date();
  const groups: { label: string; threads: Thread[] }[] = [];

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groupedThreads = threads.reduce(
    (acc, thread) => {
      const threadDate = new Date(thread.updatedAt);
      let label: string;

      if (threadDate >= today) {
        label = "Today";
      } else if (threadDate >= yesterday) {
        label = "Yesterday";
      } else if (threadDate >= sevenDaysAgo) {
        label = "Previous 7 days";
      } else if (threadDate >= thirtyDaysAgo) {
        label = "Previous 30 days";
      } else if (threadDate.getFullYear() === now.getFullYear()) {
        label = threadDate.toLocaleString("default", { month: "long" });
      } else {
        label = threadDate.getFullYear().toString();
      }

      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push(thread);
      return acc;
    },
    {} as Record<string, Thread[]>
  );

  for (const [label, threads] of Object.entries(groupedThreads)) {
    groups.push({ label, threads });
  }

  return groups.sort((a, b) => {
    const order = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days"];
    const aIndex = order.indexOf(a.label);
    const bIndex = order.indexOf(b.label);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return b.threads[0].updatedAt.getTime() - a.threads[0].updatedAt.getTime();
  });
}