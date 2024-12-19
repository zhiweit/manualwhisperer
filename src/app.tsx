// @refresh reload
import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import { ErrorBoundary, Suspense } from "solid-js";
import "./app.css";
import { Toaster } from "./components/ui/toast";

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60, // 1 minute
        staleTime: 1 * 1000, // Data becomes stale
        refetchInterval: 10 * 1000,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <Router
        root={(props) => {
          return (
            <MetaProvider>
              <Title>Manual Whisperer</Title>

              <ErrorBoundary
                fallback={(err) => {
                  console.error("RootLayout ErrorBoundary: ", err);
                  return (
                    <div>
                      <h1>Something went wrong</h1>
                      <div>Please try refreshing the page.</div>
                      <div>Check console for more information.</div>
                    </div>
                  );
                }}
              >
                <Suspense>{props.children}</Suspense>
              </ErrorBoundary>
            </MetaProvider>
          );
        }}
      >
        <FileRoutes />
      </Router>

      <Toaster />
    </QueryClientProvider>
  );
}
