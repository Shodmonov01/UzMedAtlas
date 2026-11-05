import { useRef } from "react";
import { MOTION_OK, SplitText, gsap, useGSAP } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { useLang, type Text } from "@/shared/i18n/lang";

// The same wording the Health Checker uses (its first question, one of its examples, its duration choices).
const DURATIONS: Text[] = [
  { ru: "Несколько дней", uz: "Bir necha kun", en: "A few days" },
  { ru: "Несколько недель", uz: "Bir necha hafta", en: "A few weeks" },
  { ru: "Несколько месяцев", uz: "Bir necha oy", en: "A few months" },
  { ru: "Больше года", uz: "Bir yildan ortiq", en: "Over a year" },
];
const PICKED = 2;

/** The last word before the footer: an invitation to the Health Checker on a dark panel. On the left the heading,
 *  a line of text and the button; on the right a card that plays a short conversation with the checker, in the
 *  checker's own words, as the reader scrolls to it. With reduced motion the conversation is simply shown. */
export function FinalCta() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // A fresh vars object for each trigger: ScrollTrigger keeps a reference to the object it is given.
        const trigger = () => ({ trigger: ".final-cta-panel", start: "top 78%", once: true });
        SplitText.create(".final-cta-title", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.4, stagger: 0.12, ease: "expo.out", scrollTrigger: trigger() }),
        });
        gsap.from([".final-cta-kicker", ".final-cta-text"], {
          y: 24,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.1,
          delay: 0.2,
          scrollTrigger: trigger(),
        });

        // The conversation follows the scroll: each message rises in, then the answer is picked and the result appears.
        const chat = gsap.timeline({
          defaults: { ease: "power2.out", duration: 1 },
          scrollTrigger: { trigger: ".final-cta-chat", start: "top 82%", end: "bottom 62%", scrub: 0.6 },
        });
        chat
          .from(".final-cta-chat", { autoAlpha: 0, scale: 0.96, transformOrigin: "50% 100%" })
          .from(".final-cta-msg", { y: 18, autoAlpha: 0, stagger: 0.9 })
          .from(".final-cta-choice", { y: 10, autoAlpha: 0, stagger: 0.25 }, "<0.4")
          .to(".final-cta-choice.is-picked", { backgroundColor: "#0b2a3d", color: "#ffffff", boxShadow: "inset 0 0 0 1.5px #0b2a3d", duration: 0.5 })
          .from(".final-cta-result", { y: 18, autoAlpha: 0 });
      });

      // Without motion the picked answer is simply shown as picked.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".final-cta-choice.is-picked", { backgroundColor: "#0b2a3d", color: "#ffffff", boxShadow: "inset 0 0 0 1.5px #0b2a3d" });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="final-cta" aria-labelledby="final-cta-title">
      <div className="wrap">
        <div className="final-cta-panel">
          <div className="final-cta-copy">
            <p className="final-cta-kicker">
              <span aria-hidden="true" />
              Health Checker
            </p>
            <h2 id="final-cta-title" className="final-cta-title">
              {lang === "uz" ? (
                <>
                  Nima bezovta qilayotganini ayting. Biz <em>qayerga murojaat qilishni</em> aytamiz.
                </>
              ) : lang === "en" ? (
                <>
                  Tell us what bothers you. We will suggest <em>where to go.</em>
                </>
              ) : (
                <>
                  Расскажите, что беспокоит. Мы подскажем, <em>куда обратиться.</em>
                </>
              )}
            </h2>
            <p className="final-cta-text">
              {t({
                ru: "Ответьте на несколько вопросов, и Health Checker предложит направление и подходящие клиники. Диагноз он не ставит.",
                uz: "Bir nechta savolga javob bering, Health Checker yoʻnalish va mos klinikalarni taklif qiladi. U tashxis qoʻymaydi.",
                en: "Answer a few questions and Health Checker will suggest a specialty and suitable clinics. It does not make a diagnosis.",
              })}
            </p>
          </div>

          <div className="final-cta-chat" aria-hidden="true">
            <div className="final-cta-chat-head">
              <span className="final-cta-chat-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 21.2c-.3 0-.5-.1-.7-.2C7.4 18.4 2.5 14.6 2.5 9.4 2.5 6.2 4.9 3.8 8 3.8c1.6 0 3 .8 4 2 1-1.2 2.4-2 4-2 3.1 0 5.5 2.4 5.5 5.6 0 5.2-4.9 9-8.8 11.6-.2.1-.4.2-.7.2Z" />
                  <path d="M6.5 11.2h2.6l1.4-2.6 2.3 5 1.6-2.4h3.1" fill="none" stroke="var(--paper)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <strong>Health Checker</strong>
              <span className="final-cta-chat-note">{t({ ru: "Это не диагноз", uz: "Bu tashxis emas", en: "Not a diagnosis" })}</span>
            </div>

            <div className="final-cta-chat-body">
              <p className="final-cta-msg is-operator">{t({ ru: "Опишите, что вас беспокоит, своими словами.", uz: "Sizni nima bezovta qilayotganini oʻz soʻzlaringiz bilan yozing.", en: "Describe what bothers you in your own words." })}</p>
              <p className="final-cta-msg is-user">{t({ ru: "Хочу проверить сердце", uz: "Yuragimni tekshirmoqchiman", en: "I want to check my heart" })}</p>
              <div className="final-cta-msg is-operator">
                {t({ ru: "Как давно это беспокоит?", uz: "Bu qachondan beri bezovta qilmoqda?", en: "How long has it bothered you?" })}
                <span className="final-cta-choices">
                  {DURATIONS.map((label, i) => (
                    <span key={label.ru} className={`final-cta-choice${i === PICKED ? " is-picked" : ""}`}>
                      {t(label)}
                    </span>
                  ))}
                </span>
              </div>
            </div>

            <div className="final-cta-result">
              <span>{t({ ru: "Предварительное направление", uz: "Dastlabki yoʻnalish", en: "Preliminary specialty" })}</span>
              <strong>
                {t({ ru: "Кардиология", uz: "Kardiologiya", en: "Cardiology" })}
                <ArrowIcon />
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
