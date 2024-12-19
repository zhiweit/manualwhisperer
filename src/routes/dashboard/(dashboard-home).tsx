import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { For, Show, Suspense } from "solid-js";
import { machineListQueryOpts } from "~/api/machine/query";
import { A, RouteDefinition } from "@solidjs/router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SearchKnowledgeBase } from "~/routes/dashboard/components/SearchKnowledgeBase";
import { getLatestMachineAlarm } from "~/api/machine/rpc";
import { AlertTriangle } from "~/components/icons/AlertTriangle";
import { createMemo } from "solid-js";
import { TickIcon } from "~/components/icons/TickIcon";
// import { formatDistanceToNow } from "~/utils/dateUtils";
import { Skeleton } from "~/components/ui/skeleton";

export const route = {
  preload() {
    const queryClient = useQueryClient();
    queryClient.prefetchQuery(machineListQueryOpts({}));
  },
} satisfies RouteDefinition;

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

const MachineCardSkeleton = () => (
  <div class="w-full border rounded-lg p-3">
    <div class="mb-2 flex justify-center">
      <Skeleton height={24} width={200} radius={4} />
    </div>
    <div class="mb-4 mt-4 flex justify-center">
      <Skeleton height={20} width={96} radius={4} />
    </div>
    <div class="text-xs text-gray-500 mb-1">
      <Skeleton height={14} width={112} radius={2} />
    </div>
    <div class="space-y-1">
      <div class="flex justify-between items-center">
        <Skeleton height={16} width={64} radius={2} />
        <Skeleton height={16} width={80} radius={2} />
      </div>
      <div class="flex justify-between items-center">
        <Skeleton height={16} width={64} radius={2} />
        <Skeleton height={16} width={80} radius={2} />
      </div>
      <div class="flex justify-between items-center">
        <Skeleton height={16} width={64} radius={2} />
        <Skeleton height={16} width={80} radius={2} />
      </div>
    </div>
  </div>
);

function MachineCardsSkeleton() {
  return (
    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
      <For each={Array(10).fill(0)}>{() => <MachineCardSkeleton />}</For>
    </div>
  );
}

export default function DashboardHomePage() {
  const machines = createQuery(() => machineListQueryOpts({}));

  return (
    <div class="bg-gray-50">
      <div class="container mx-auto py-4">
        {/* Title Headers */}
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-semibold">Dashboard</h1>
        </div>

        {/* Machine List */}
        <Suspense fallback={<MachineCardsSkeleton />}>
          <Show
            when={(machines.data?.length ?? 0) > 0 && machines.data}
            fallback={<div>No machines found</div>}
          >
            {(data) => (
              <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
                <For each={data()}>
                  {(machine) => <MachineCard machine={machine} />}
                </For>
              </div>
            )}
          </Show>
        </Suspense>

        {/* Search Knowledge Base/Alarm Code */}
        <SearchKnowledgeBase />
      </div>
    </div>
  );
}
function MachineCard(props: {
  machine: { id: number; name: string; machineType: string };
}) {
  const latestAlarms = createQuery(() => ({
    queryKey: ["latestAlarms", props.machine.id.toString()],
    queryFn: () => getLatestMachineAlarm(props.machine.id.toString()),
  }));

  const unresolvedAlarmCount = createMemo(() => {
    if (latestAlarms.data) {
      return latestAlarms.data.filter((alarm) => !alarm.machine_alarm.endTime)
        .length;
    }
    return 0;
  });

  const borderColor = () =>
    unresolvedAlarmCount() > 0 ? "border-red-500" : "border-green-500";

  const latestThreeAlarms = createMemo(() => {
    return latestAlarms.data
      ?.filter((alarm) => !alarm.machine_alarm.endTime)
      .slice(0, 3)
      .map((alarm) => ({
        code: alarm.alarm.code,
        time: formatDistanceToNow(new Date(alarm.machine_alarm.startTime)),
      }));
  });

  return (
    <A href={`./machine/${props.machine.id}`}>
      <Card
        class={`hover:bg-blue-50 flex flex-col h-full border ${borderColor()}`}
      >
        <CardHeader class="p-3 text-center">
          <CardTitle class="text-sm md:text-base font-medium mb-1">
            {props.machine.name}
          </CardTitle>
          <div class="flex justify-center">
            {unresolvedAlarmCount() > 0 ? (
              <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                <AlertTriangle class="h-3.5 w-3.5 mr-1" />
                Error ({unresolvedAlarmCount()})
              </span>
            ) : (
              <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <TickIcon class="h-3.5 w-3.5 mr-1" />
                Operational
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent class="p-3 pt-0 flex flex-col justify-between flex-grow mt-2">
          {unresolvedAlarmCount() > 0 ? (
            <>
              <div class="text-xs text-gray-500 mb-1">Latest Alarm Codes:</div>
              <div class="flex flex-col gap-1">
                <For each={latestThreeAlarms()}>
                  {(alarm) => (
                    <div class="flex items-center justify-between">
                      <span class="text-xs bg-red-50 text-red-700 px-1 rounded">
                        {alarm.code}
                      </span>
                      <span class="text-xs text-gray-500">{alarm.time}</span>
                    </div>
                  )}
                </For>
              </div>
            </>
          ) : (
            <div class="flex justify-center items-center h-full">
              <TickIcon class="h-16 w-16 text-green-500/70" />
            </div>
          )}
        </CardContent>
      </Card>
    </A>
  );
}
