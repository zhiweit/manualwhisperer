import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { SearchBar } from "./components/SearchBar";
import { useSearchParams, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, For, createSignal } from "solid-js";
import { TrashIcon } from "~/components/icons/TrashIcon";
import { Button } from "~/components/ui/button";
import { getPinnedAlarmDetails, togglePinnedAlarm } from "~/api/knowledge/rpc";
import { Alarm } from "~/db/schema";
import { showToast } from "~/components/ui/toast";

/* 
TODO: 
1. Need virtual scroll
*/
type PageSearchParams = {
  type?: string;
  q?: string;
};

export default function KnowledgePinnedPage() {
  const [searchParams, setSearchParams] = useSearchParams<PageSearchParams>();
  const [pinnedAlarms, setPinnedAlarms] = createSignal<Alarm[]>([]);
  const navigate = useNavigate();

  const fetchPinnedAlarms = async () => {
    const alarms = await getPinnedAlarmDetails();
    setPinnedAlarms(alarms);
  };

  createEffect(() => {
    fetchPinnedAlarms();
  });

  const filteredAlarms = createMemo(() => {
    const searchQuery = searchParams.q?.toLowerCase() || "";
    return pinnedAlarms().filter(
      (alarm) =>
        alarm.code.toLowerCase().includes(searchQuery) ||
        alarm.message.toLowerCase().includes(searchQuery)
    );
  });

  const handleAlarmClick = (alarmId: number) => {
    navigate(`/dashboard/knowledge/${alarmId}`);
  };

  async function handleUnpin(alarmId: number, alarmCode: string) {
    try {
      await togglePinnedAlarm(alarmId);
      await fetchPinnedAlarms();
      showToast({
        title: `Alarm ${alarmCode} unpinned`,
        description: "The alarm has been successfully unpinned.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error unpinning alarm:", error);
      showToast({
        title: "Error",
        description: `Failed to unpin alarm ${alarmCode}. Please try again.`,
        variant: "error",
      });
    }
  }

  return (
    <div class="bg-zinc-50 h-[calc(100vh-7rem)] flex flex-col">
      {/* Title Headers */}
      <div class="container flex flex-col my-2">
        <h1 class="text-xl font-semibold flex flex-row mt-2">
          Manage Pinned Guides
        </h1>
        <p class="text-sm text-gray-500 mt-1 mb-4">
          View and manage your pinned guides here
        </p>
      </div>

      {/* Search bar */}
      <div class="container mb-4">
        <SearchBar
          value={searchParams.q ?? ""}
          onInput={(value) => setSearchParams({ q: value })}
          onClear={() => setSearchParams({ q: undefined })}
        />
      </div>

      {/* Pinned Alarms Table */}
      <div class="flex-1 overflow-hidden container">
        <div class="h-full bg-white border rounded-lg p-8 flex flex-col">
          <div class="overflow-auto flex-1">
            <Table class="w-full relative ">
              <TableHeader class="sticky top-0 bg-white z-10 ">
                <TableRow class="">
                  <TableHead class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                    Alarm Code
                  </TableHead>
                  <TableHead class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                    Alarm Message
                  </TableHead>
                  <TableHead class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody class="bg-white divide-y divide-gray-200 ">
                <For each={filteredAlarms()}>
                  {(alarm) => (
                    <TableRow
                      class="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleAlarmClick(alarm.id)}
                    >
                      <TableCell class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                        {alarm.code}
                      </TableCell>
                      <TableCell class="px-6 py-4 whitespace-normal text-xs md:text-sm text-gray-500 max-w-md ">
                        {alarm.message}
                      </TableCell>
                      <TableCell class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 ">
                        <Button
                          variant="ghost"
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            handleUnpin(alarm.id, alarm.code);
                          }}
                        >
                          <TrashIcon class="w-5 h-5 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
