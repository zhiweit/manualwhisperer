import { createQuery } from "@tanstack/solid-query";
import Chart from "chart.js/auto";
import { onMount, Show, Suspense } from "solid-js";
import {
  averageResolutionTimeQueryOpts,
  errorCountOverTimeQueryOpts,
  machinesWithMostErrorsQueryOpts,
  mostCommonErrorsQueryOpts,
  mostCommonQuestionsQueryOpts,
  usersWithMostQuestionsQueryOpts,
} from "~/api/analytics/query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const chartColors = {
  teal: {
    bg: "rgba(75, 192, 192, 0.2)",
    border: "rgb(75, 192, 192)",
  },
  blue: {
    bg: "rgba(59, 130, 246, 0.2)",
    border: "rgb(59, 130, 246)",
  },
  rose: {
    bg: "rgba(244, 63, 94, 0.2)",
    border: "rgb(244, 63, 94)",
  },
  amber: {
    bg: "rgba(245, 158, 11, 0.2)",
    border: "rgb(245, 158, 11)",
  },
  purple: {
    bg: "rgba(168, 85, 247, 0.2)",
    border: "rgb(168, 85, 247)",
  },
} as const;

function ErrorTrendsChart(props: {
  data: { timePeriod: string; count: number }[];
}) {
  let chartRef: HTMLCanvasElement;

  onMount(() => {
    const ctx = chartRef.getContext("2d");
    if (ctx) {
      new Chart(ctx, {
        type: "line",
        data: {
          labels: props.data.map((d) => d.timePeriod),
          datasets: [
            {
              label: "Error Count",
              data: props.data.map((d) => d.count),
              borderColor: chartColors.blue.border,
              backgroundColor: chartColors.blue.bg,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }
  });

  return <canvas ref={(el) => (chartRef = el)} height="200" />;
}

function BarChart(props: {
  data: { label: string; value: number }[];
  label: string;
  color?: keyof typeof chartColors;
}) {
  let chartRef: HTMLCanvasElement;
  const color = chartColors[props.color || "teal"];

  onMount(() => {
    const ctx = chartRef.getContext("2d");
    if (ctx) {
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: props.data.map((d) => d.label),
          datasets: [
            {
              label: props.label,
              data: props.data.map((d) => d.value),
              backgroundColor: color.bg,
              borderColor: color.border,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }
  });

  return <canvas ref={(el) => (chartRef = el)} height="200" />;
}

function HorizontalBarChart(props: {
  data: { label: string; value: number }[];
  label: string;
  color?: keyof typeof chartColors;
}) {
  let chartRef: HTMLCanvasElement;
  const color = chartColors[props.color || "teal"];

  onMount(() => {
    const ctx = chartRef.getContext("2d");
    if (ctx) {
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: props.data.map((d) => d.label),
          datasets: [
            {
              label: props.label,
              data: props.data.map((d) => d.value),
              backgroundColor: color.bg,
              borderColor: color.border,
              borderWidth: 1,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
            },
          },
        },
      });
    }
  });

  return <canvas ref={(el) => (chartRef = el)} height="200" />;
}

export default function AnalyticsPage() {
  // Initialize all queries
  const commonErrors = createQuery(() => mostCommonErrorsQueryOpts());
  const machineErrors = createQuery(() => machinesWithMostErrorsQueryOpts());
  const errorTrends = createQuery(() => errorCountOverTimeQueryOpts("day"));
  const userQuestions = createQuery(() => usersWithMostQuestionsQueryOpts());
  const commonQuestions = createQuery(() => mostCommonQuestionsQueryOpts());
  const avgResolutionTime = createQuery(() => averageResolutionTimeQueryOpts());

  return (
    <div class="bg-zinc-50 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Title Headers */}
      <div class="container flex items-center justify-between my-2">
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold flex flex-row mt-2">Analytics</h1>
          <p class="text-sm text-gray-500 mt-1 mb-4">
            View analytics and insights about errors and user questions
          </p>
        </div>
      </div>

      <div class="container grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Most Common Errors */}
        <Suspense fallback={<CardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Most Common Errors</CardTitle>
              <CardDescription>
                Top 10 most frequent error occurrences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Show when={commonErrors.data} fallback={<div>Loading...</div>}>
                <BarChart
                  data={
                    commonErrors.data?.map((error) => ({
                      label: error.code,
                      value: error.count,
                    })) ?? []
                  }
                  label="Error Count"
                  color="amber"
                />
              </Show>
            </CardContent>
          </Card>
        </Suspense>

        {/* Machines with Most Errors */}
        <Suspense fallback={<CardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Machines with Most Errors</CardTitle>
              <CardDescription>Top 10 machines by error count</CardDescription>
            </CardHeader>
            <CardContent>
              <Show when={machineErrors.data} fallback={<div>Loading...</div>}>
                <HorizontalBarChart
                  data={
                    machineErrors.data?.map((machine) => ({
                      label: machine.machineName,
                      value: machine.count,
                    })) ?? []
                  }
                  label="Error Count"
                  color="rose"
                />
              </Show>
            </CardContent>
          </Card>
        </Suspense>

        {/* Users with Most Questions */}
        <Suspense fallback={<CardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Most Active Users</CardTitle>
              <CardDescription>
                Users who ask the most questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Show when={userQuestions.data} fallback={<div>Loading...</div>}>
                <HorizontalBarChart
                  data={
                    userQuestions.data?.map((user) => ({
                      label: user.username,
                      value: user.count,
                    })) ?? []
                  }
                  label="Question Count"
                  color="purple"
                />
              </Show>
            </CardContent>
          </Card>
        </Suspense>

        {/* Most Common Questions */}
        <Suspense fallback={<CardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Most common user questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Show
                when={commonQuestions.data}
                fallback={<div>Loading...</div>}
              >
                <BarChart
                  data={
                    commonQuestions.data?.map((question) => ({
                      label: question.name,
                      value: question.count,
                    })) ?? []
                  }
                  label="Times Asked"
                  color="teal"
                />
              </Show>
            </CardContent>
          </Card>
        </Suspense>

        {/* Error Trends Over Time */}
        <Suspense fallback={<CardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Error Trends</CardTitle>
              <CardDescription>Number of errors over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Show when={errorTrends.data} fallback={<div>Loading...</div>}>
                <ErrorTrendsChart data={errorTrends.data!} />
              </Show>
            </CardContent>
          </Card>
        </Suspense>

        {/* Average Resolution Time */}
        <Suspense fallback={<CardSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Average Resolution Time</CardTitle>
              <CardDescription>Average time to resolve issues</CardDescription>
            </CardHeader>
            <CardContent>
              <Show
                when={avgResolutionTime.data}
                fallback={<div>Loading...</div>}
              >
                <BarChart
                  data={
                    avgResolutionTime.data?.map((entry) => ({
                      label: `${entry.resolutionTime}min${entry.resolutionTime > 1 ? "s" : ""}`,
                      value: entry.count,
                    })) ?? []
                  }
                  label="Count"
                  color="amber"
                />
              </Show>
            </CardContent>
          </Card>
        </Suspense>
      </div>
    </div>
  );
}

const CardSkeleton = () => (
  <div class="animate-pulse bg-gray-200 rounded-lg h-[300px]" />
);
