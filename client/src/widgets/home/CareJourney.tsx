import { useRef, type ReactNode } from "react";
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from "@/shared/lib/gsap";
import { useLang } from "@/shared/i18n/lang";

/** Solid, rounded glyphs in the manner of the iPhone's system symbols. Details marked .ic-cut are drawn in the
 *  colour of the tile behind, so they read as cut out of the shape. */
const icon = (shape: ReactNode) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {shape}
  </svg>
);

const STEPS = [
  {
    title: { ru: "Заявка", uz: "Ariza", en: "Request" },
    text: {
      ru: "Опишите, что беспокоит, и приложите обследования. Координатор ответит в течение суток.",
      uz: "Nima bezovta qilayotganini yozing va tekshiruv natijalarini biriktiring. Koordinator bir kun ichida javob beradi.",
      en: "Describe what bothers you and attach your test results. A coordinator replies within a day.",
    },
    who: { ru: "Координатор", uz: "Koordinator", en: "Coordinator" },
    icon: icon(
      <>
        <path d="M20.6 2.4a1.2 1.2 0 0 1 .3 1.3l-6 16.6a1.3 1.3 0 0 1-2.4.1l-3-6.2-6.3-3a1.3 1.3 0 0 1 .1-2.4l16-6.6a1.2 1.2 0 0 1 1.3.2Z" />
        <path className="ic-cut" d="M9.8 14.2 15.4 8.6" fill="none" strokeWidth="1.7" />
      </>,
    ),
  },
  {
    title: { ru: "План и стоимость", uz: "Reja va narx", en: "Plan and cost" },
    text: {
      ru: "Клиника изучит документы и предложит программу лечения с ценой ещё до поездки.",
      uz: "Klinika hujjatlarni oʻrganib, safargacha narxi bilan davolash dasturini taklif qiladi.",
      en: "The clinic reviews your documents and proposes a treatment program with its price before you travel.",
    },
    who: { ru: "Клиника и врач", uz: "Klinika va shifokor", en: "Clinic and doctor" },
    icon: icon(
      <>
        <rect x="4" y="4.5" width="16" height="17.5" rx="3.6" />
        <rect className="ic-cut-ring" x="8" y="2" width="8" height="5" rx="1.8" strokeWidth="1.6" />
        <path className="ic-cut" d="M8.3 12h7.4M8.3 16h4.6" fill="none" strokeWidth="1.8" />
      </>,
    ),
  },
  {
    title: { ru: "Перелёт и встреча", uz: "Parvoz va kutib olish", en: "Flight and arrival" },
    text: {
      ru: "Поможем с визой, билетами, трансфером из аэропорта и проживанием рядом с клиникой.",
      uz: "Viza, chiptalar, aeroportdan transfer va klinika yaqinida turar joy bilan yordam beramiz.",
      en: "We help with the visa, tickets, airport transfer and a place to stay near the clinic.",
    },
    who: { ru: "Координатор", uz: "Koordinator", en: "Coordinator" },
    icon: icon(<path d="M21.5 12c0-1-.8-1.6-1.8-1.6h-4.9L10.3 3.3c-.2-.3-.5-.5-.9-.5H8.2l2.2 7.6H5.7L4.1 8.3a.7.7 0 0 0-.5-.3H2.5l1 4-1 4h1.1c.2 0 .4-.1.5-.3l1.6-2.1h4.7l-2.2 7.6h1.2c.4 0 .7-.2.9-.5l4.5-7.1h4.9c1 0 1.8-.6 1.8-1.6Z" />),
  },
  {
    title: { ru: "Лечение", uz: "Davolanish", en: "Treatment" },
    text: {
      ru: "Диагностика и лечение на современном оборудовании, у врачей, которые говорят на вашем языке.",
      uz: "Zamonaviy uskunalarda, sizning tilingizda gaplashadigan shifokorlarda tashxis va davolash.",
      en: "Diagnostics and treatment on modern equipment, with doctors who speak your language.",
    },
    who: { ru: "Лечащий врач", uz: "Davolovchi shifokor", en: "Attending doctor" },
    icon: icon(
      <>
        <path d="M8.5 6.5V5.3c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v1.2" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="2.5" y="6.5" width="19" height="15" rx="3.8" />
        <path className="ic-cut" d="M10.8 10.2h2.4v2.6h2.6v2.4h-2.6v2.6h-2.4v-2.6H8.2v-2.4h2.6Z" />
      </>,
    ),
  },
  {
    title: { ru: "Восстановление", uz: "Tiklanish", en: "Recovery" },
    text: {
      ru: "Санатории, горный воздух и древние города: отдых, который продолжает лечение.",
      uz: "Sanatoriylar, togʻ havosi va qadimiy shaharlar: davolanishni davom ettiradigan dam olish.",
      en: "Sanatoriums, mountain air and ancient cities: rest that carries the treatment on.",
    },
    who: { ru: "Санаторий и координатор", uz: "Sanatoriy va koordinator", en: "Sanatorium and coordinator" },
    icon: icon(
      <>
        <path d="M20.3 3.2c.4 0 .7.3.7.7C21 14.8 16.9 20.5 10.6 20.5c-3.4 0-6.1-2.3-6.1-5.6 0-7 5.6-11.7 15.8-11.7Z" />
        <path className="ic-cut" d="M4.6 20.2C7 14.6 10.6 11 15.8 8.4" fill="none" strokeWidth="1.7" />
      </>,
    ),
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

/** How a trip for treatment goes, from the first request to the flight home, as a flow on a dotted canvas:
 *  step cards zig-zag down the page, linked by rounded connectors with ring ends (like nodes in a workflow editor).
 *  The heading stays in view on the left (wide screens) above a large number of the current step that rolls on.
 *  The whole flow is tied to the scroll: each card rises in, then the connector to the next one draws itself, and
 *  scrolling back takes it apart again. With reduced motion everything is simply in place. */
export function CareJourney() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      const section = root.current!;
      const canvas = section.querySelector<HTMLElement>(".journey-canvas")!;
      const svg = canvas.querySelector<SVGSVGElement>(".journey-links")!;
      const nodes = Array.from(canvas.querySelectorAll<HTMLElement>(".journey-flow-node"));
      const links = Array.from(svg.querySelectorAll<SVGGElement>(".journey-link"));
      const reel = section.querySelector<HTMLElement>(".journey-counter-reel");

      // The connectors are drawn from the cards' real boxes: down out of one card, a rounded turn across, and down
      // into the next. Transforms (the scroll animation) do not change offsetTop/offsetLeft, so this stays exact.
      function layout() {
        svg.setAttribute("width", String(canvas.offsetWidth));
        svg.setAttribute("height", String(canvas.offsetHeight));
        links.forEach((link, i) => {
          const a = nodes[i];
          const b = nodes[i + 1];
          const x1 = a.offsetLeft + a.offsetWidth / 2;
          const y1 = a.offsetTop + a.offsetHeight;
          const x2 = b.offsetLeft + b.offsetWidth / 2;
          const y2 = b.offsetTop;
          const ym = (y1 + y2) / 2;
          const dir = Math.sign(x2 - x1);
          const r = Math.max(0, Math.min(22, Math.abs(x2 - x1) / 2, (y2 - y1) / 2 - 4));
          const d =
            dir === 0
              ? `M${x1} ${y1}V${y2}`
              : `M${x1} ${y1}V${ym - r}Q${x1} ${ym} ${x1 + dir * r} ${ym}H${x2 - dir * r}Q${x2} ${ym} ${x2} ${ym + r}V${y2}`;
          link.querySelectorAll("path").forEach((path) => path.setAttribute("d", d));
          const [start, end] = link.querySelectorAll("circle");
          start.setAttribute("cx", String(x1));
          start.setAttribute("cy", String(y1));
          end.setAttribute("cx", String(x2));
          end.setAttribute("cy", String(y2));
        });
      }
      layout();
      const observer = new ResizeObserver(() => layout());
      observer.observe(canvas);

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".journey-aside-inner > *", {
          y: 32,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: section, start: "top 72%", once: true },
        });

        // One timeline scrubbed by the scroll: card, connector, card, connector...
        const flow = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: canvas, start: "top 78%", end: "bottom 88%", scrub: 0.6 },
        });
        // Cards only fade and grow in place (no slide), so a connector always ends exactly on its card; each card
        // starts appearing as the line reaches it.
        nodes.forEach((node, i) => {
          flow.from(node, { autoAlpha: 0, scale: 0.94, transformOrigin: "50% 0%", duration: 0.8 }, i === 0 ? 0 : "-=0.35");
          const link = links[i];
          if (!link) return;
          const [start, end] = link.querySelectorAll("circle");
          flow
            .from(start, { scale: 0, transformOrigin: "50% 50%", duration: 0.2 })
            .fromTo(link.querySelector(".journey-link-line"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: "none" })
            .from(end, { scale: 0, transformOrigin: "50% 50%", duration: 0.2 });
        });

        // The big number on the left follows the card in the middle of the screen.
        nodes.slice(0, STEPS.length).forEach((node, i) => {
          ScrollTrigger.create({
            trigger: node,
            start: "center 62%",
            onEnter: () => reel && gsap.to(reel, { yPercent: (-100 / STEPS.length) * i, duration: 0.8, ease: "expo.out", overwrite: true }),
            onLeaveBack: () =>
              reel && gsap.to(reel, { yPercent: (-100 / STEPS.length) * Math.max(0, i - 1), duration: 0.8, ease: "expo.out", overwrite: true }),
          });
        });
      });

      return () => observer.disconnect();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="medtourism" className="journey" aria-labelledby="journey-title">
      <div className="journey-inner wrap">
        <div className="journey-aside">
          <div className="journey-aside-inner">
            <h2 id="journey-title" className="section-title">
              {lang === "uz" ? (
                <>
                  Davolanish <em>Oʻzbekistonda</em> qanday oʻtadi
                </>
              ) : lang === "en" ? (
                <>
                  How treatment <em>in&nbsp;Uzbekistan</em> works
                </>
              ) : (
                <>
                  Как проходит лечение <em>в&nbsp;Узбекистане</em>
                </>
              )}
            </h2>
            <p className="section-lead">
              {t({
                ru: "Пять шагов от первой заявки до возвращения домой. На каждом рядом координатор.",
                uz: "Birinchi arizadan uyga qaytishgacha besh qadam. Har birida yoningizda koordinator boʻladi.",
                en: "Five steps from the first request to the trip home. A coordinator is with you at each one.",
              })}
            </p>
            <div className="journey-counter" aria-hidden="true">
              <div className="journey-counter-reel">
                {STEPS.map((_, i) => (
                  <span key={i}>{pad(i + 1)}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="journey-canvas">
          <svg className="journey-links" aria-hidden="true">
            {STEPS.map((step) => (
              <g key={step.title.ru} className="journey-link">
                <path className="journey-link-track" />
                <path className="journey-link-line" pathLength={1} />
                <circle r="5.5" />
                <circle r="5.5" />
              </g>
            ))}
          </svg>

          <ol className="journey-flow">
            {STEPS.map((step, i) => (
              <li key={step.title.ru} className="journey-flow-node journey-card">
                {i === 0 ? <span className="journey-card-tag">{t({ ru: "Старт", uz: "Start", en: "Start" })}</span> : null}
                <div className="journey-card-head">
                  <span className="journey-card-icon">{step.icon}</span>
                  <h3>{t(step.title)}</h3>
                  <span className="journey-card-num">{pad(i + 1)}</span>
                </div>
                <p className="journey-card-row">{t(step.text)}</p>
                <p className="journey-card-row is-meta">
                  <span>{t({ ru: "С вами", uz: "Siz bilan", en: "With you" })}</span>
                  <strong>{t(step.who)}</strong>
                </p>
              </li>
            ))}
            <li className="journey-flow-node journey-finish">
              <span className="journey-finish-dot" aria-hidden="true" />
              {t({ ru: "Возвращение домой", uz: "Uyga qaytish", en: "Back home" })}
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
