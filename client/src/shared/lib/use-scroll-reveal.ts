import { useEffect, useRef } from "react";

/** Reveal each marked element once; content stays readable without motion support. */
export function useScrollReveal<T extends HTMLElement>(refreshKey?: unknown) {
  const rootRef = useRef<T>(null);
  const revealed = useRef(new WeakSet<Element>());

  useEffect(() => {
    const root = rootRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || preference.matches || !("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;

    const pending = new Set<HTMLElement>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        pending.delete(element);
        element.classList.remove("reveal-pending");
        revealed.current.add(element);
        const animation = element.animate(
          [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 650, delay: Number(element.dataset.revealDelay) || 0, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" },
        );
        animations.add(animation);
        void animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });

    for (const element of root.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (revealed.current.has(element)) continue;
      if (element.getBoundingClientRect().top >= window.innerHeight) {
        element.classList.add("reveal-pending");
        pending.add(element);
      }
      observer.observe(element);
    }

    const stop = () => {
      observer.disconnect();
      pending.forEach((element) => element.classList.remove("reveal-pending"));
      animations.forEach((animation) => animation.cancel());
      pending.clear();
      animations.clear();
    };
    preference.addEventListener("change", stop);
    return () => {
      preference.removeEventListener("change", stop);
      stop();
    };
  }, [refreshKey]);

  return rootRef;
}
