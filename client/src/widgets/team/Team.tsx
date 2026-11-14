import { useRef } from "react";
import { MOTION_OK, gsap, useGSAP } from "@/shared/lib/gsap";
import { useLang, type Text } from "@/shared/i18n/lang";

type Member = { role: Text; name: string; org?: string };

const TEAM: Member[] = [
  { role: { ru: "Председатель Ассоциации", uz: "Assotsiatsiya raisi", en: "Chair of the Association" }, name: "Salokhiddin Mukhitdinov" },
  { role: { ru: "Помощник председателя", uz: "Rais yordamchisi", en: "Assistant to the Chair" }, name: "Feruza Rizaeva" },
  { role: { ru: "Медицинский маркетолог", uz: "Tibbiy marketolog", en: "Medical marketer" }, name: "Shakhnoza Yakubova", org: "Maestro Marketing Agency" },
  { role: { ru: "Дизайнер", uz: "Dizayner", en: "Designer" }, name: "Daria Novikova" },
  { role: { ru: "Редактор", uz: "Muharrir", en: "Editor" }, name: "Aziza Rasulova" },
  { role: { ru: "Разработчик электронной версии", uz: "Elektron versiya ishlab chiquvchisi", en: "Developer of the digital edition" }, name: "B. B. Rakhmonberdiev", org: "RZB TECH agency" },
];

const CLINICS_COUNT = 26;

/** The people behind Medguide, read like film credits: one hairline row per member (role, name, agency), the rules
 *  drawing in and the names rising as the list scrolls in; then the thanks to the clinics around a large counting "26". */
export function Team() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".team-head > *", {
          y: 32,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".team-head", start: "top 82%", once: true },
        });
        gsap.utils.toArray<HTMLElement>(".team-row").forEach((row) => {
          gsap
            .timeline({ scrollTrigger: { trigger: row, start: "top 90%", once: true } })
            .from(row.querySelector(".team-row-rule"), { scaleX: 0, transformOrigin: "left center", duration: 1.3, ease: "expo.inOut" }, 0)
            .from(row.querySelectorAll(".team-row-role, .team-row-name, .team-row-org"), { yPercent: 60, autoAlpha: 0, duration: 1, stagger: 0.06, ease: "expo.out" }, 0.2);
        });
        gsap
          .timeline({ scrollTrigger: { trigger: ".team-thanks", start: "top 80%", once: true } })
          .from(".team-thanks-count strong", { textContent: 0, snap: { textContent: 1 }, duration: 1.8, ease: "power2.out" }, 0)
          .from(".team-thanks-copy > *", { y: 28, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "expo.out" }, 0.2);
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="team" className="team" aria-labelledby="team-title">
      <div className="wrap">
        <div className="team-head">
          <h2 id="team-title" className="section-title">
            {lang === "uz" ? (
              <>
                Medguide ustida <em>jamoa</em> ishladi
              </>
            ) : lang === "en" ? (
              <>
                The <em>team</em> behind Medguide
              </>
            ) : (
              <>
                Над Medguide работала <em>команда</em>
              </>
            )}
          </h2>
          <p className="section-lead">
            {t({
              ru: "Этот каталог стал результатом совместной работы людей, которые верят в потенциал медицины Узбекистана.",
              uz: "Bu katalog Oʻzbekiston tibbiyoti salohiyatiga ishonadigan odamlarning birgalikdagi mehnati natijasidir.",
              en: "This catalog is the result of the joint work of people who believe in the potential of Uzbek medicine.",
            })}
          </p>
        </div>

        <ul className="team-list">
          {TEAM.map((member) => (
            <li key={member.name} className="team-row">
              <span className="team-row-rule" aria-hidden="true" />
              <span className="team-row-role">{t(member.role)}</span>
              <strong className="team-row-name">{member.name}</strong>
              {member.org ? <span className="team-row-org">{member.org}</span> : null}
            </li>
          ))}
        </ul>

        <div className="team-thanks">
          <p className="team-thanks-count" aria-hidden="true">
            <strong>{CLINICS_COUNT}</strong>
            <span>
              {t({ ru: "частных клиник", uz: "Oʻzbekistonning", en: "private clinics" })}
              <br />
              {t({ ru: "Узбекистана", uz: "xususiy klinikasi", en: "of Uzbekistan" })}
            </span>
          </p>
          <div className="team-thanks-copy">
            <h3 className="team-thanks-label">{t({ ru: "Благодарность клиникам", uz: "Klinikalarga minnatdorchilik", en: "Thanks to the clinics" })}</h3>
            <p className="team-thanks-text">
              {lang === "uz" ? (
                <>
                  Oʻz hikoyalari, fotosuratlari va maʼlumotlarini bizga ishonib topshirgan Oʻzbekistonning {CLINICS_COUNT} ta xususiy
                  klinikasiga alohida rahmat. Aynan ular bu katalogni <em>jonli</em> qiladi.
                </>
              ) : lang === "en" ? (
                <>
                  Special thanks to the {CLINICS_COUNT} private clinics of Uzbekistan that trusted us with their stories, photos and
                  data. They are what makes this catalog <em>alive</em>.
                </>
              ) : (
                <>
                  Отдельная благодарность {CLINICS_COUNT} частным клиникам Узбекистана, которые доверили нам свои истории,
                  фотографии и данные. Именно они делают этот каталог <em>живым</em>.
                </>
              )}
            </p>
            <p className="team-sign">
              <img src="/brand/logo.svg" alt="" width={28} height={28} />
              Medguide, 2026
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
