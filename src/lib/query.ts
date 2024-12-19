import { QueryClient } from "@tanstack/solid-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60, // 1 minute
      staleTime: 1 * 1000, // Data becomes stale
      refetchInterval: 10 * 1000,
    },
  },
});
