import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { pickName } from "@/shared/i18n/lang";
import { fetchSpecialties, type Specialty } from "@/shared/api/client";
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from "@/shared/lib/gsap";

type Props = { onPick: (slug: string) => void };

// Each row repeats its directions so it stays wider than the screen while it loops.
const COPIES = 4;
// Drift speed in px per millisecond (about 45 px a second), and the most a fast scroll adds on top.
const DRIFT = 0.045;
const MAX_BOOST = 0.6;

/** Every direction of treatment, as two full-width rows of large words that drift on their own in opposite
 *  directions, without end: the first row (ink) to the left, the second (muted) to the right, a small logo mark
 *  between the words. Scrolling speeds them up for a moment, then they settle back to their drift; they only move
 *  while the section is on screen. Each word opens the catalog filtered to its direction (no hover effect).
 *  With reduced motion the rows stand still and wrap, each direction shown once. */
export function Directions({ onPick }: Props) {
  const root = useRef<HTMLElement>(null);
  const specialties = useQuery({ queryKey: ["specialties"], queryFn: fetchSpecialties });
  const items = specialties.data || [];
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)].filter((row) => row.length);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".directions-head > *", {
          y: 28,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 78%", once: true },
        });
        // Each row loops over the width of one copy of its words, so the wrap from one end to the other is seamless.
        const lanes = gsap.utils.toArray<HTMLElement>(".directions-row").map((row, i) => ({
          row,
          dir: i % 2 === 0 ? -1 : 1,
          x: 0,
          span: 0,
          set: gsap.quickSetter(row, "x", "px"),
        }));
        const measure = () => {
          lanes.forEach((lane, i) => {
            const words = lane.row.children as HTMLCollectionOf<HTMLElement>;
            const perCopy = Number(lane.row.dataset.count) || 0;
            lane.span = perCopy && words[perCopy] ? words[perCopy].offsetLeft - words[0].offsetLeft : 0;
            // The second row starts half a copy in, so the two rows never line up.
            if (i % 2 === 1 && lane.x === 0) lane.x = -lane.span / 2;
          });
        };
        measure();

        let boost = 0;
        const watch = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            boost = Math.min(Math.abs(self.getVelocity()) / 4000, MAX_BOOST);
          },
          onRefresh: measure,
        });
        const tick = (_time: number, delta: number) => {
          boost *= 0.94;
          if (!watch.isActive) return;
          const step = (DRIFT + boost) * Math.min(delta, 50);
          lanes.forEach((lane) => {
            if (!lane.span) return;
            lane.x = gsap.utils.wrap(-lane.span, 0, lane.x + lane.dir * step);
            lane.set(lane.x);
          });
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
      });
    },
    { scope: root, dependencies: [items.length], revertOnUpdate: true },
  );

  if (specialties.isError) return null;

  return (
    <section ref={root} className="directions" aria-labelledby="directions-title">
      <div className="directions-head wrap">
        <h2 id="directions-title" className="section-title">
          <>
              Treatment <em>specialties</em>
            </>
        </h2>
        <p className="section-lead">
          Pick a specialty and we will show the clinics that work in it.
        </p>
      </div>

      <div className="directions-rows">
        {rows.length ? (
          rows.map((row, i) => <DirectionsRow key={i} items={row} muted={i % 2 === 1} onPick={onPick} />)
        ) : (
          <div className="directions-row" aria-hidden="true">
            {[220, 300, 260, 320, 240].map((width, i) => (
              <span key={i} className="direction-skeleton" style={{ width }} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** One row: the directions, then repeats that only fill the row (hidden from assistive tech and the keyboard). */
function DirectionsRow({ items, muted, onPick }: { items: Specialty[]; muted: boolean; onPick: (slug: string) => void }) {
  return (
    <ul className={`directions-row${muted ? " is-muted" : ""}`} data-count={items.length}>
      {Array.from({ length: COPIES }, (_, copy) =>
        items.map((item) => (
          <li key={`${copy}-${item.slug}`} className={copy ? "is-repeat" : undefined} aria-hidden={copy ? true : undefined}>
            <button
              type="button"
              className="direction-link"
              tabIndex={copy ? -1 : undefined}
              title={pickName(item.descriptionRu, item.descriptionEn) || undefined}
              onClick={() => onPick(item.slug)}
            >
              {pickName(item.nameRu, item.nameEn)}
            </button>
          </li>
        )),
      )}
    </ul>
  );
}
