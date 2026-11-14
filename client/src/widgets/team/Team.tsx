import { useRef } from "react";
import { MOTION_OK, gsap, useGSAP } from "@/shared/lib/gsap";

type Member = { role: string; name: string; org?: string; url?: string };

const TEAM: Member[] = [
  { role: "Chair of the Association", name: "Salokhiddin Mukhitdinov" },
  { role: "Assistant to the Chair", name: "Feruza Rizaeva" },
  { role: "Medical marketer", name: "Shakhnoza Yakubova", org: "Maestro Marketing Agency" },
  { role: "Designer", name: "Daria Novikova" },
  { role: "Editor", name: "Aziza Rasulova" },
  { role: "Developer of the digital edition", name: "B. B. Rakhmonberdiev", org: "RZB TECH agency", url: "https://rzbtech.uz/ru" },
];

const CLINICS_COUNT = 26;

/** The people behind Medguide, read like film credits: one hairline row per member (role, name, agency), the rules
 *  drawing in and the names rising as the list scrolls in; then the thanks to the clinics around a large counting "26". */
export function Team() {
  const root = useRef<HTMLElement>(null);

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
            <>
                The <em>team</em> behind Medguide
              </>
          </h2>
          <p className="section-lead">
            This catalog is the result of the joint work of people who believe in the potential of Uzbek medicine.
          </p>
        </div>

        <ul className="team-list">
          {TEAM.map((member) => (
            <li key={member.name} className="team-row">
              <span className="team-row-rule" aria-hidden="true" />
              <span className="team-row-role">{member.role}</span>
              <strong className="team-row-name">{member.name}</strong>
              {member.org && member.url ? (
                <a className="team-row-org" href={member.url} target="_blank" rel="noopener noreferrer">
                  {member.org}
                </a>
              ) : member.org ? (
                <span className="team-row-org">{member.org}</span>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="team-thanks">
          <p className="team-thanks-count" aria-hidden="true">
            <strong>{CLINICS_COUNT}</strong>
            <span>
              private clinics
              <br />
              of Uzbekistan
            </span>
          </p>
          <div className="team-thanks-copy">
            <h3 className="team-thanks-label">Thanks to the clinics</h3>
            <p className="team-thanks-text">
              <>
                  Special thanks to the {CLINICS_COUNT} private clinics of Uzbekistan that trusted us with their stories, photos and
                  data. They are what makes this catalog <em>alive</em>.
                </>
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
