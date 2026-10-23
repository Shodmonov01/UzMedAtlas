import { useMemo } from "react";

type Corner = "tl" | "tr" | "bl" | "br";

const COLS = 9;
const ROWS = 7;
const OPACITIES = [0.14, 0.2, 0.26, 0.32, 0.4];
const SCALES = [1, 0.88, 0.74];

/** Barely-there tiles of the logo mark scattered over one corner of a section (after uztta.uz): a grid that thins out
 *  away from the corner and fades under a radial mask, each mark at its own opacity, size, turn and small offset,
 *  a few slowly twinkling. The layout comes from `seed`, so it is the same on every render and every visit.
 *  The parent needs `position: relative` and `isolation: isolate` (the tiles sit behind its content). */
export function LogoTiles({ corner, seed = 1 }: { corner: Corner; seed?: number }) {
  const tiles = useMemo(() => layout(corner, seed), [corner, seed]);
  return (
    <div className={`logo-tiles logo-tiles-${corner}`} aria-hidden="true">
      {tiles.map((tile) => (
        <span
          key={`${tile.row}-${tile.col}`}
          style={{
            gridRow: tile.row,
            gridColumn: tile.col,
            opacity: tile.opacity,
            translate: `calc(var(--tile) * ${tile.dx}) calc(var(--tile) * ${tile.dy})`,
          }}
        >
          <img
            src="/brand/logo.svg"
            alt=""
            decoding="async"
            draggable={false}
            className={tile.twinkle ? "is-twinkling" : undefined}
            style={{ rotate: `${tile.turn}deg`, scale: tile.scale, animationDelay: `${tile.delay}s` }}
          />
        </span>
      ))}
    </div>
  );
}

function layout(corner: Corner, seed: number) {
  const random = mulberry32(seed);
  const tiles = [];
  for (let row = 1; row <= ROWS; row++) {
    for (let col = 1; col <= COLS; col++) {
      // 0 at the corner, 1 at the far edge of the grid; tiles get sparser further out.
      const x = corner[1] === "l" ? (col - 1) / (COLS - 1) : (COLS - col) / (COLS - 1);
      const y = corner[0] === "t" ? (row - 1) / (ROWS - 1) : (ROWS - row) / (ROWS - 1);
      if (random() > 0.74 - Math.hypot(x, y) * 0.45) continue;
      tiles.push({
        row,
        col,
        opacity: OPACITIES[Math.floor(random() * OPACITIES.length)],
        scale: SCALES[Math.floor(random() * SCALES.length)],
        turn: Math.floor(random() * 4) * 11.25,
        dx: ((random() - 0.5) * 0.9).toFixed(2),
        dy: ((random() - 0.5) * 0.9).toFixed(2),
        twinkle: random() < 0.2,
        delay: (random() * 4).toFixed(2),
      });
    }
  }
  return tiles;
}

/** Small seeded random generator, so a corner's pattern never changes between renders. */
function mulberry32(seed: number) {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
