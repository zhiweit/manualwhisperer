import { createSignal, createResource, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { alarmListQueryOpts } from "~/api/knowledge/query";
import { Button } from "~/components/ui/button";
import { SearchIcon } from "~/components/icons/SearchIcon";
import { CloseIcon } from "~/components/icons/CloseIcon";
import { debounce } from "@solid-primitives/scheduled";

export function SearchKnowledgeBase() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = createSignal("");
  let inputRef: HTMLInputElement | undefined;

  const debouncedSearch = debounce((value: string) => {
    setSearchInput(value);
  }, 250);

  const [alarmSuggestions] = createResource(searchInput, async (search) => {
    if (!search) return null;
    const result = await alarmListQueryOpts({ search }).queryFn();
    return result.length > 0 ? result : null;
  });

  return (
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Search Knowledge Base</h2>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-grow">
          <label class="flex items-center group border rounded bg-white border-gray-300 focus-within:border-blue-400 focus-within:ring-[3px] focus-within:ring-blue-600/10 h-10 w-full">
            <SearchIcon class="w-5 h-5 text-gray-400 ml-2 mr-2" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search"
              class="text-sm text-gray-900 placeholder-gray-500 bg-transparent focus:outline-none w-full"
              onInput={(e) => debouncedSearch(e.currentTarget.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  navigate(
                    `/dashboard/knowledge?q=${encodeURIComponent(searchInput())}`
                  );
                }
              }}
            />
          </label>

          <Show when={searchInput()}>
            <div
              class="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchInput("")}
            >
              <CloseIcon class="h-4 w-4 text-gray-400 hover:text-gray-500 cursor-pointer" />
            </div>
          </Show>
        </div>

        <Button
          class="min-w-[180px] text-white rounded-sm"
          onClick={() =>
            navigate(
              `/dashboard/knowledge?q=${encodeURIComponent(searchInput())}`
            )
          }
        >
          Search
        </Button>
      </div>

      <Show when={!alarmSuggestions.loading && alarmSuggestions()}>
        <div class="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
          <ul class="py-1 divide-y divide-gray-200 max-h-60 overflow-y-auto">
            <For each={alarmSuggestions()}>
              {(suggestion) => (
                <li
                  class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSearchInput(suggestion.code);
                    navigate(
                      `/dashboard/knowledge?q=${encodeURIComponent(suggestion.code)}`
                    );
                  }}
                >
                  <div class="text-sm font-bold text-gray-600">
                    {suggestion.code}
                  </div>
                  <div class="text-xs text-gray-500 font-medium line-clamp-2 truncate">
                    {suggestion.message}
                  </div>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
}
