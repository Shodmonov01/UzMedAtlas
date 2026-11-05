import { useRef } from "react";
import { MOTION_OK, SplitText, gsap, useGSAP } from "@/shared/lib/gsap";
import { useLang, type Text } from "@/shared/i18n/lang";

const STATS: { prefix?: Text; value: number; unit: Text; label: Text }[] = [
  {
    prefix: { ru: "от", uz: "", en: "from" },
    value: 30,
    unit: { ru: "%", uz: "%", en: "%" },
    label: {
      ru: "экономии по сравнению с клиниками за рубежом",
      uz: "va undan koʻproq tejash — xorijiy klinikalarga nisbatan",
      en: "savings compared with clinics abroad",
    },
  },
  {
    value: 24,
    unit: { ru: "ч", uz: "soat", en: "h" },
    label: {
      ru: "на ответ клиники и предварительный план лечения",
      uz: "ichida klinika javobi va dastlabki davolash rejasi",
      en: "for the clinic's reply and a preliminary treatment plan",
    },
  },
  {
    value: 6,
    unit: { ru: "языков", uz: "til", en: "languages" },
    label: {
      ru: "общения с координаторами и врачами",
      uz: "da koordinatorlar va shifokorlar bilan muloqot",
      en: "to talk with coordinators and doctors",
    },
  },
];

/** Why Uzbekistan, right under the hero: one statement whose words fill in as the reader scrolls through it,
 *  then three figures that count up while their rules draw in. With reduced motion the text and figures are final. */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(".manifesto-text", { type: "words", wordsClass: "manifesto-word" });
        gsap.fromTo(
          split.words,
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: ".manifesto-text", start: "top 78%", end: "bottom 42%", scrub: true },
          },
        );

        const stats = gsap.timeline({ scrollTrigger: { trigger: ".manifesto-stats", start: "top 82%", once: true } });
        stats
          .from(".manifesto-rule", { scaleX: 0, transformOrigin: "left center", duration: 1.4, stagger: 0.12, ease: "expo.inOut" }, 0)
          .from(".manifesto-stat-body", { y: 28, autoAlpha: 0, duration: 1, stagger: 0.12 }, 0.25);
        gsap.utils.toArray<HTMLElement>(".manifesto-count").forEach((el, i) => {
          stats.from(el, { textContent: 0, snap: { textContent: 1 }, duration: 1.8, ease: "power2.out" }, 0.3 + i * 0.12);
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="manifesto" aria-label={t({ ru: "О медицинском туризме", uz: "Tibbiy turizm haqida", en: "About medical tourism" })}>
      <div className="wrap">
        <div className="manifesto-head">
          <p className="manifesto-kicker">
            <span className="manifesto-kicker-dot" aria-hidden="true" />
            {t({ ru: "Почему Узбекистан", uz: "Nega Oʻzbekiston", en: "Why Uzbekistan" })}
          </p>
          <p className="manifesto-text">
            {lang === "uz" ? (
              <>
                Oʻzbekiston <em>davolanish</em> uchun keladigan mamlakatga aylanmoqda. Biz <em>tekshirilgan klinikalar</em>,{" "}
                <em>halol narxlar</em> va <span className="manifesto-keep">sizning tilingizda</span> gaplashadigan koordinatorlarni jamladik.
              </>
            ) : lang === "en" ? (
              <>
                Uzbekistan is becoming a country people travel to <em>for treatment</em>. We have gathered <em>vetted clinics</em>,{" "}
                <em>honest prices</em> and coordinators who speak <span className="manifesto-keep">your language.</span>
              </>
            ) : (
              <>
                Узбекистан становится страной, куда приезжают <em>лечиться</em>. Мы собрали <em>проверенные клиники</em>,{" "}
                <em>честные цены</em> и координаторов, которые говорят <span className="manifesto-keep">на вашем языке.</span>
              </>
            )}
          </p>
        </div>

        <ul className="manifesto-stats">
          {STATS.map((stat) => (
            <li key={stat.value} className="manifesto-stat">
              <span className="manifesto-rule" aria-hidden="true" />
              <div className="manifesto-stat-body">
                <p className="manifesto-figure">
                  {stat.prefix && t(stat.prefix) ? <small>{t(stat.prefix)}</small> : null}
                  <span className="manifesto-count">{stat.value}</span>
                  <small>{t(stat.unit)}</small>
                </p>
                <p className="manifesto-label">{t(stat.label)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
