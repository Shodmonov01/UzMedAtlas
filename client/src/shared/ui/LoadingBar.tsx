import { useIsFetching } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/** A thin brand-coloured bar along the top of the screen while a page or its data is loading.
 *  It waits 150 ms before showing, so quick loads never flash it. */
export function LoadingBar() {
  const routing = useRouterState({ select: (s) => s.status === "pending" });
  const fetching = useIsFetching() > 0;
  const busy = routing || fetching;
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!busy) {
      setShown(false);
      return;
    }
    const timer = window.setTimeout(() => setShown(true), 150);
    return () => window.clearTimeout(timer);
  }, [busy]);

  return <div className={`loading-bar${shown ? " is-active" : ""}`} role="progressbar" aria-hidden={!shown} aria-label="Loading" />;
}
