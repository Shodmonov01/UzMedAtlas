import { motion } from "motion/react";
import { LogoTiles } from "@/shared/ui/LogoTiles";
import { Reveal, RevealGroup, revealItem } from "@/shared/ui/Reveal";

type Member = { role: string; name: string; org?: string };

const TEAM: Member[] = [
  { role: "Председатель Ассоциации", name: "Салохиддин Мухитдинов" },
  { role: "Помощник председателя", name: "Феруза Ризаева" },
  { role: "Медицинский маркетолог", name: "Шахноза Якубова", org: "Maestro Marketing Agency" },
  { role: "Дизайнер", name: "Дарья Новикова" },
  { role: "Редактор", name: "Азиза Расулова" },
  { role: "Разработчик электронной версии", name: "Рахмонбердиев Б.Б.", org: "RZB TECH agency" },
];

const CLINICS_COUNT = 26;

/** The people behind Medguide, right after medical tourism: a full-width dark section read like film credits —
 *  the heading and intro, one hairline row per member (number, role, name, agency), then the thanks to the clinics. */
export function Team() {
  return (
    <section id="team" className="team" aria-labelledby="team-title">
      <LogoTiles corner="tr" seed={7} />
      <div className="team-inner">
        <div className="team-head">
          <Reveal>
            <p className="team-eyebrow">Команда проекта</p>
            <h2 id="team-title" className="team-title">
              Над Medguide работала <em>команда</em>
            </h2>
          </Reveal>
          <Reveal className="team-lead" delay={0.1}>
            <p>
              Этот каталог стал результатом совместной работы людей, которые верят в потенциал медицины Узбекистана. Каждый
              из них внёс свой вклад, чтобы Medguide получился полезным, удобным и информативным для читателя.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="team-list" role="list">
          {TEAM.map((member, i) => (
            <motion.div key={member.name} role="listitem" variants={revealItem} className="team-row">
              <span className="team-row-index" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="team-row-role">{member.role}</span>
              <strong className="team-row-name">{member.name}</strong>
              {member.org ? <span className="team-row-org">{member.org}</span> : null}
            </motion.div>
          ))}
        </RevealGroup>

        <Reveal className="team-thanks">
          <p className="team-thanks-count" aria-hidden="true">
            <strong>{CLINICS_COUNT}</strong>
            <span>
              частных клиник
              <br />
              Узбекистана
            </span>
          </p>
          <div className="team-thanks-copy">
            <h3 className="team-thanks-label">Благодарность клиникам</h3>
            <p className="team-thanks-text">
              Отдельная благодарность {CLINICS_COUNT} частным клиникам Узбекистана, которые доверили нам свои истории,
              фотографии и данные. Именно они делают этот каталог <em>живым</em>.
            </p>
            <p className="team-sign">
              <img src="/brand/logo.svg" alt="" width={28} height={28} />
              Medguide, 2026
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
