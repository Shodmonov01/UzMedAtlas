import { useSyncExternalStore } from "react";

/** Whether the opening loader has lifted. The home hero waits for it, so its entrance plays as the curtain rises
 *  instead of underneath it. Pages opened without the loader (the cabinet, the moderation desk) count as lifted. */
let done = false;
const listeners = new Set<() => void>();

export function finishIntro() {
  if (done) return;
  done = true;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIntroDone() {
  return useSyncExternalStore(subscribe, () => done, () => true);
}
