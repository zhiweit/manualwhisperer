import { Show } from "solid-js";
import { SearchIcon } from "~/components/icons/SearchIcon";
import { CloseIcon } from "~/components/icons/CloseIcon";

type SearchBarProps = {
  value: string;
  onInput: (value: string) => void;
  onClear: () => void;
};

export function SearchBar(props: SearchBarProps) {
  return (
    <div class="w-full md:w-[300px] relative">
      <label class="flex items-center group border rounded-sm bg-card border-gray-300 focus-within:border-blue-400 focus-within:ring-[3px] focus-within:ring-blue-600/10 h-10 w-full">
        <SearchIcon class="h-4 w-4 text-gray-500 ml-2 mr-1" />
        <span class="sr-only">Search</span>
        <input
          type="text"
          placeholder="Search"
          class="text-sm text-gray-900 placeholder-gray-500 bg-transparent focus:outline-none w-full"
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
        />
      </label>

      <Show when={props.value}>
        <div
          class="absolute right-4 top-1/2 transform -translate-y-1/2"
          onClick={() => props.onClear()}
        >
          <CloseIcon class="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-500" />
        </div>
      </Show>
    </div>
  );
}
