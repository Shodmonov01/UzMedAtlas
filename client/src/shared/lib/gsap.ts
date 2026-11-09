import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText, useGSAP);
gsap.defaults({ ease: "power3.out", duration: 0.9 });

/** Media query for every scroll and entrance animation; with reduced motion the page is simply there. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Signature easing of the site: a quick start that settles slowly. */
export const EASE_OUT = "expo.out";

// Webfonts change line breaks and section heights, so the scroll positions are measured again once they are in.
if (typeof document !== "undefined" && document.fonts) {
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
}

// Content that arrives later (the clinic catalog, images) changes the page height without a resize, and every trigger
// below it would then fire at its old, wrong place. So the triggers are measured again whenever the page height
// settles at a new value. Only the height matters, which also keeps this from looping on refresh's own pin spacing.
if (typeof window !== "undefined" && "ResizeObserver" in window) {
  let lastHeight = 0;
  let timer = 0;
  // The refresh waits for a quiet moment (no new height for 400ms, then an idle frame), so it never lands in the middle
  // of the opening animation.
  const idle = (fn: () => void) => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(fn, { timeout: 1200 });
    else setTimeout(fn, 60);
  };
  new ResizeObserver(([entry]) => {
    const height = Math.round(entry.contentRect.height);
    if (height === lastHeight) return;
    lastHeight = height;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => idle(() => ScrollTrigger.refresh()), 400);
  }).observe(document.body);
}

/** Glides the page to an element (by id or node) or a scroll position (instantly with reduced motion), `offset` px
 *  above it, leaving the URL alone.
 *  A GSAP tween rather than the browser's smooth scroll, so it keeps going when ScrollTrigger re-measures the page
 *  (new catalog results, a resize) on the way. The reader's own wheel, touch or key takes over at once; GSAP's
 *  autoKill is off, so a re-measure that nudges the scroll position mid-glide is not taken for the reader scrolling. */
export function glideTo(target: string | HTMLElement | number, offset = 0) {
  const el = typeof target === "string" ? document.getElementById(target) : target;
  if (el === null) return false;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inputs = ["wheel", "touchstart", "keydown"] as const;
  // The site's CSS smooth scroll (inner pages) would ease every step of the tween again and stall it short of the
  // target, so it is switched off for the glide and put back after.
  const html = document.documentElement;
  const behavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  const release = () => {
    inputs.forEach((name) => window.removeEventListener(name, stop));
    html.style.scrollBehavior = behavior;
  };
  const tween = gsap.to(window, {
    scrollTo: { y: el, offsetY: offset, autoKill: false },
    duration: still ? 0 : 1.3,
    ease: "power3.inOut",
    overwrite: true,
    onComplete: release,
    onInterrupt: release,
  });
  function stop() {
    tween.kill();
    release();
  }
  inputs.forEach((name) => window.addEventListener(name, stop, { passive: true }));
  return true;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
