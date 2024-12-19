import {
  A,
  RouteDefinition,
  useIsRouting,
  useNavigate,
  useParams,
} from "@solidjs/router";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { createMemo, Show, For } from "solid-js";
import {
  machineLatestAlarmQueryOpts,
  machineQueryOpts,
} from "~/api/machine/query";
import { ArrowBackIcon } from "~/components/icons/ArrowBackIcon";
import { PenSquare } from "~/components/icons/PenSquare";
import { Button } from "~/components/ui/button";

import { AlertTriangle } from "~/components/icons/AlertTriangle";
import { Badge } from "~/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
// https://www.npmjs.com/package/editorjs-html
import edjsHTML from "editorjs-html";

type PageParams = {
  machineId: string;
};

// type PageSearchParams = {
//   /**
//    * Filter by type
//    */
//   type?: string;
//   /**
//    * Search query text
//    */
//   q?: string;
// };

export const route = {
  preload({ params }) {
    const queryClient = useQueryClient();

    const id = params.machineId;
    queryClient.prefetchQuery(
      machineQueryOpts({
        id,
      })
    );
  },
} satisfies RouteDefinition;

export default function MachineDetailPage() {
  const isRouting = useIsRouting();
  const params = useParams<PageParams>();
  const machineId = createMemo(() => params.machineId);

  const machine = createQuery(() => machineQueryOpts({ id: machineId() }));
  const latestAlarm = createQuery(() =>
    machineLatestAlarmQueryOpts({ id: machineId() })
  );

  // const [searchParams, setSearchParams] = useSearchParams<PageSearchParams>();
  // const search = createMemo(() => searchParams.q);
  // const filterType = createMemo(() => searchParams.type);
  const navigate = useNavigate();
  const edjsParser = edjsHTML({
    // for displaying attached files
    attaches: (block: {
      data: { file: { url: string; name: string; size: number } };
    }) => {
      return `
        <div class="attached-file">
          <a href="${block.data.file.url}" target="_blank" rel="noopener noreferrer">
            ${block.data.file.name}
          </a>
          <span class="file-size">(${formatFileSize(block.data.file.size)})</span>
        </div>
      `;
    },
  });

  // Helper function to format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    else return (bytes / 1073741824).toFixed(1) + " GB";
  }

  const parsedSolution = createMemo(() => {
    if (latestAlarm.data && latestAlarm.data.length > 0) {
      const alarm = latestAlarm.data[0];
      if (alarm.alarm.solution) {
        try {
          const jsonData = JSON.parse(alarm.alarm.solution);
          const html = edjsParser.parse(jsonData);
          return html.join("");
        } catch (error) {
          console.error("Error parsing solution data:", error);
          return "Error parsing solution";
        }
      }
    }
    return "No solution available";
  });

  return (
    <div class="container mx-auto p-4">
      <div class="mb-6">
        <Button
          variant="outline"
          class="text-muted-foreground hover:text-primary"
          size="sm"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowBackIcon class="mr-2 h-4 w-4" />
          Back to all machines
        </Button>
      </div>
      <div class="flex flex-row gap-2 mb-4">
        <h1 class="text-2xl font-bold mb-4">{machine.data?.name}</h1>
        <div class="flex items-center mb-4">
          <Badge variant="secondary">{machine.data?.machineType}</Badge>
        </div>
      </div>

      <Show
        when={
          (latestAlarm.data?.filter((alarm) => !alarm.machine_alarm.endTime)
            ?.length ?? 0) > 0
        }
        fallback={
          <div class="text-green-600 font-semibold">No unresolved alarms</div>
        }
      >
        <For
          each={latestAlarm.data?.filter(
            (alarm) => !alarm.machine_alarm.endTime
          )}
        >
          {(alarm) => (
            <Card class="mb-6">
              <CardHeader class="bg-red-50 border-b border-red-200">
                <CardTitle class="text-red-700 flex items-center">
                  <AlertTriangle class="mr-2 h-5 w-5 text-red-500" />
                  {alarm.alarm.code} - {alarm.alarm.message}
                </CardTitle>
                <p class="text-sm text-red-600">
                  {formatDate(alarm.machine_alarm.startTime)}
                </p>
              </CardHeader>
              <CardContent class="pt-4">
                <div class="space-y-2 text-sm mb-4">
                  <p>
                    <strong>Affected:</strong> Axis {alarm.machine_alarm.axis}
                  </p>
                  <p>
                    <strong>Details:</strong> {alarm.alarm.desc}
                  </p>
                </div>
                <div class="bg-gray-50 p-4 rounded-md mb-4">
                  <h3 class="font-semibold mb-2">Suggested Solution</h3>
                  <div
                    class="prose prose-sm max-w-none editorjs-content max-h-[500px] overflow-y-auto"
                    // unsanitized, fix later, use DOMPurify
                    innerHTML={parsedSolution()}
                  />
                </div>
                <div class="flex flex-col items-start mt-8">
                  <p class="text-sm text-gray-600 mb-2">
                    Wrong or inaccurate solution?
                  </p>
                  <div class="flex justify-between items-center w-full">
                    <Button
                      variant="outline"
                      class="flex items-center"
                      as={A}
                      href={`/dashboard/knowledge/${alarm.alarm.id}`}
                      disabled={isRouting()}
                    >
                      <PenSquare class="mr-2 h-4 w-4" />
                      Update solution
                    </Button>
                    <p class="text-xs text-gray-500">
                      This solution was last updated on {formatDate(new Date())}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </For>
      </Show>
    </div>
  );
}

function formatDate(date?: Date | null, fallback: string = "") {
  return (
    date?.toLocaleString("en-SG", {
      dateStyle: "full",
      timeStyle: "medium",
    }) ?? fallback
  );
}
