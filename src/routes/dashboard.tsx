import { Dialog } from "@kobalte/core";
import { useWindowScrollPosition } from "@solid-primitives/scroll";
import {
  A,
  createAsync,
  RouteDefinition,
  RouteSectionProps,
  useLocation,
  useNavigate,
} from "@solidjs/router";
import { ErrorBoundary, For, JSX, Show, Suspense } from "solid-js";
import { getUser, logoutAction } from "~/api/user/rpc";
import { CloseIcon } from "~/components/icons/CloseIcon";
import { MenuIcon } from "~/components/icons/MenuIcon";
import { SearchIcon } from "~/components/icons/SearchIcon";
import { cn } from "~/lib/utils";

export const route = {
  preload: () => {
    getUser();
  },
} satisfies RouteDefinition;

export default function DashboardLayout(props: RouteSectionProps<unknown>) {
  const user = createAsync(() => getUser());
  return (
    <div class="flex flex-col min-h-svh">
      <DashboardNavbar />

      <div class="flex-1 flex flex-col bg-gray-50">
        <ErrorBoundary
          fallback={(err) => {
            console.error("DashboardLayout ErrorBoundary: ", err);
            return (
              <div>
                <h1>Something went wrong</h1>
                <div>Please try refreshing the page.</div>
                <div>Check console for more information.</div>
              </div>
            );
          }}
        >
          <Suspense>
            <Show when={user()}>{props.children}</Show>
          </Suspense>
        </ErrorBoundary>
      </div>

      <DashboardFooter />
    </div>
  );
}

const LINKS: {
  name: string;
  href: string;
  /**
   * Determines if the link is active based off current path
   */
  active: (path: string) => boolean;
}[] = [
  {
    name: "Chat",
    href: "/",
    active: (path) => path === "/" || path.startsWith("/chat"),
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    active: (path) =>
      path === "/dashboard" || path.startsWith("/dashboard/machine"),
  },
  {
    name: "Knowledge",
    href: "/dashboard/knowledge",
    active: (path) => path.startsWith("/dashboard/knowledge"),
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    active: (path) => path.startsWith("/dashboard/analytics"),
  },
];

const SCROLL_THRESHOLD = 5;

function DashboardNavbar() {
  const user = createAsync(() => getUser(), { deferStream: true });
  const scroll = useWindowScrollPosition();

  return (
    <nav
      class={cn(
        "h-16 bg-white/80 backdrop-blur-sm sticky top-0 border-b border-transparent shadow-sm shadow-transparent transition-all duration-500 z-50",
        scroll.y > SCROLL_THRESHOLD && "border-gray-200 shadow-gray-200/50"
      )}
    >
      <div class="flex h-full items-center justify-between container max-lg:px-4 gap-2">
        <div class="flex items-center gap-4 md:gap-8">
          <A href="/">
            <div class="font-semibold">LOGO</div>
          </A>
          <div class="max-md:hidden">
            <DesktopLinks />
          </div>
        </div>
        <div class="flex items-center gap-4">
          <SearchInput />
          <div class="max-md:hidden">
            {/* TODO: Add user dropdown */}
            {/* TODO: Invalidate query cache after logout */}
            <Suspense>
              <form action={logoutAction} method="post">
                <button
                  type="submit"
                  class="font-medium px-3 py-1 text-gray-500 hover:text-gray-900"
                  title={`Logged in as ${user()?.username}`}
                >
                  Logout
                </button>
              </form>
            </Suspense>
          </div>
          <div class="md:hidden">
            <MobileLinksMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}

function DesktopLinks() {
  const location = useLocation();
  return (
    <div class="flex items-center gap-0.5 md:gap-2">
      <For each={LINKS}>
        {(link) => {
          const active = () => link.active(location.pathname);
          return (
            <A
              href={link.href}
              class={cn(
                "font-medium rounded transition px-2 py-1",
                active()
                  ? "text-gray-900 underline underline-offset-4 hover:decoration-2"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {link.name}
            </A>
          );
        }}
      </For>
    </div>
  );
}

function MobileLinksMenu() {
  const location = useLocation();
  return (
    <Dialog.Root>
      <Dialog.Trigger class="md:hidden flex items-center gap-2 h-9 px-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded">
        <MenuIcon class="size-5" /> Menu
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 z-50" />
        <div class="fixed inset-y-0 right-0 z-50 flex">
          <Dialog.Content class="w-screen bg-white shadow-lg">
            <div class="flex flex-col h-full w-full">
              <div class="flex items-center justify-between p-4 border-b sticky top-0">
                <Dialog.Title class="text-lg font-semibold">Menu</Dialog.Title>
                <Dialog.CloseButton class="p-2 text-gray-500 hover:text-gray-900 transition hover:bg-gray-100 rounded-full">
                  <CloseIcon class="h-5 w-5" />
                </Dialog.CloseButton>
              </div>
              <div class="flex-1 overflow-y-auto py-4">
                <For each={LINKS}>
                  {(link) => {
                    const active = () => link.active(location.pathname);
                    return (
                      <Dialog.CloseButton
                        as={A}
                        href={link.href}
                        class={cn(
                          "block px-4 py-3 font-medium transition",
                          active()
                            ? "text-gray-900 bg-gray-100"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        {link.name}
                      </Dialog.CloseButton>
                    );
                  }}
                </For>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchInput() {
  const navigate = useNavigate();

  const handleKeyPress: JSX.EventHandlerUnion<
    HTMLInputElement,
    KeyboardEvent
  > = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    const searchQuery = event.currentTarget.value.trim();
    if (searchQuery === "") {
      return;
    }
    navigate(`/dashboard/knowledge?q=${encodeURIComponent(searchQuery)}`);
    event.currentTarget.value = "";
  };

  return (
    <label class="flex items-center group border border-transparent rounded-sm bg-gray-100 focus-within:border-gray-900 focus-within:ring-[3px] focus-within:ring-gray-900/10 h-9 min-w-[150px] w-[20vw] lg:max-w-[250px]">
      <SearchIcon class="size-4 text-gray-500 ml-2 mr-1 shrink-0" />
      <span class="sr-only">Search</span>
      <input
        type="text"
        placeholder="Search"
        onKeyPress={handleKeyPress}
        class="text-sm text-gray-900 placeholder-gray-500 bg-transparent focus:outline-none"
      />
    </label>
  );
}

function DashboardFooter() {
  return <footer />;
}
