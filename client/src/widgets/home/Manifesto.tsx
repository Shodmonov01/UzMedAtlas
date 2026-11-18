import { Fragment, useEffect, useRef, useState } from "react";
import { animate, m, useInView, useScroll, useTransform, type MotionValue } from "motion/react";

const STATS: { prefix?: string; value: number; unit: string; label: string }[] = [
  {
    prefix: "from",
    value: 30,
    unit: "%",
    label: "savings compared with clinics abroad",
  },
  {
    value: 24,
    unit: "h",
    label: "for the clinic's reply and a preliminary treatment plan",
  },
  {
    value: 6,
    unit: "languages",
    label: "to talk with coordinators and doctors",
  },
];

/** The site's easing: a quick start that settles slowly. */
const EASE = [0.16, 1, 0.3, 1] as const;

type Token = { word: string; accent?: boolean; after?: string };
const plain = (text: string): Token[] => text.split(" ").map((word) => ({ word }));
const accent = (text: string, after?: string): Token[] => {
  const words = text.split(" ");
  return words.map((word, i) => ({ word, accent: true, after: i === words.length - 1 ? after : undefined }));
};

/** The statement, word by word; "your language." stays on one line. */
const LEAD: Token[] = [
  ...plain("Uzbekistan is becoming a country people travel to"),
  ...accent("for treatment", "."),
  ...plain("We have gathered"),
  ...accent("vetted clinics", ","),
  ...accent("honest prices"),
  ...plain("and coordinators who speak"),
];
const KEEP: Token[] = plain("your language.");
const WORDS = LEAD.length + KEEP.length;

const stillMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One word of the statement: dim until the reading line reaches it, then full white (or green). */
function Word({ token, index, progress, still }: { token: Token; index: number; progress: MotionValue<number>; still: boolean }) {
  const start = index / WORDS;
  const opacity = useTransform(progress, [start, Math.min(1, start + 2.5 / WORDS)], [0.2, 1]);
  return (
    <m.span style={still ? undefined : { opacity }}>
      {token.accent ? <em>{token.word}</em> : token.word}
      {token.after}
    </m.span>
  );
}

/** One figure: its rule draws in from the left, the number counts up from zero and the label rises, once, when it
 *  comes into view. */
function Stat({ stat, index, still }: { stat: (typeof STATS)[number]; index: number; still: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const delay = index * 0.12;

  useEffect(() => {
    const node = count.current;
    if (!inView || still || !node) return;
    const controls = animate(0, stat.value, {
      duration: 1.6,
      delay,
      ease: EASE,
      onUpdate: (value) => {
        node.textContent = String(Math.round(value));
      },
    });
    return () => controls.stop();
  }, [inView, still, stat.value, delay]);

  return (
    <li ref={ref} className="manifesto-stat">
      <m.span
        className="manifesto-rule"
        aria-hidden="true"
        initial={still ? false : { scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : undefined}
        transition={{ duration: 1.1, delay, ease: EASE }}
      />
      <m.div
        className="manifesto-stat-body"
        initial={still ? false : { opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.8, delay: delay + 0.1, ease: EASE }}
      >
        <p className="manifesto-figure" aria-label={`${stat.prefix ? `${stat.prefix} ` : ""}${stat.value} ${stat.unit}`}>
          {stat.prefix ? <small aria-hidden="true">{stat.prefix}</small> : null}
          <span ref={count} className="manifesto-count" aria-hidden="true">
            {still ? stat.value : 0}
          </span>
          <small aria-hidden="true">{stat.unit}</small>
        </p>
        <p className="manifesto-label">{stat.label}</p>
      </m.div>
    </li>
  );
}

/** Why Uzbekistan, right under the hero (Motion): the label rises in, the statement's words light up one after another
 *  as the reader scrolls through it, then three figures count up while their rules draw in. With reduced motion the
 *  text and figures are simply final. */
export function Manifesto() {
  const text = useRef<HTMLParagraphElement>(null);
  const [still] = useState(stillMotion);
  // 0 when the statement's top reaches 80% of the screen height, 1 when its bottom reaches the middle.
  const { scrollYProgress } = useScroll({ target: text, offset: ["start 0.8", "end 0.5"] });

  return (
    <section id="medtourism" className="manifesto" aria-label="About medical tourism">
      <div className="wrap">
        <div className="manifesto-head">
          <m.p
            className="manifesto-kicker"
            initial={still ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="manifesto-kicker-dot" aria-hidden="true" />
            Why Uzbekistan
          </m.p>
          <p ref={text} className="manifesto-text">
            {LEAD.map((token, i) => (
              <Fragment key={i}>
                <Word token={token} index={i} progress={scrollYProgress} still={still} />{" "}
              </Fragment>
            ))}
            <span className="manifesto-keep">
              {KEEP.map((token, i) => (
                <Fragment key={i}>
                  {i > 0 ? " " : null}
                  <Word token={token} index={LEAD.length + i} progress={scrollYProgress} still={still} />
                </Fragment>
              ))}
            </span>
          </p>
        </div>

        <ul className="manifesto-stats">
          {STATS.map((stat, i) => (
            <Stat key={stat.value} stat={stat} index={i} still={still} />
          ))}
        </ul>
      </div>
    </section>
  );
}
