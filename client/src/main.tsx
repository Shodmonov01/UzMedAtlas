import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { LazyMotion, domAnimation } from "motion/react";
import { routeTree } from "./app/router/routeTree.gen";
import { Preloader } from "./shared/ui/Preloader";
import "./app/styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      // No refetch (and no loading bar) every time the tab regains focus.
      refetchOnWindowFocus: false,
    },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  // Keep the reader's place on reload and on back/forward.
  scrollRestoration: true,
  // Load a page's code and data while the pointer rests on its link, so the click opens it at once.
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Motion's animation features are loaded once here; components use the light `m` elements. */}
    <LazyMotion features={domAnimation}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
      {/* Outside the router, so it is on screen from the very first render, before the page's code has arrived. */}
      <Preloader />
    </LazyMotion>
  </StrictMode>,
);
