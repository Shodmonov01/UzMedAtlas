import { motion } from "motion/react";
import { Reveal, RevealGroup, revealItem } from "@/shared/ui/Reveal";
import { PhotoSlides, type Slide } from "@/shared/ui/PhotoSlides";

// Shown one at a time; each photo is framed on its people inside the square.
const PHOTOS: Slide[] = [
  { src: "/images/achsi/team.jpg", alt: "Делегации Ассоциации и ACHSI после подписания меморандума", position: "center 55%" },
  { src: "/images/achsi/signing.jpg", alt: "Подписание меморандума на стенде Ассоциации и ACHS International", position: "center 62%" },
  { src: "/images/achsi/handshake.jpg", alt: "Обмен подписанными меморандумами", position: "center 45%" },
];

const DIRECTIONS = [
  "Предварительная оценка клиник по международным стандартам, выявление недостатков и практическая помощь в подготовке к аккредитации",
  "Совершенствование систем контроля качества, безопасности пациентов и управления",
  "Анализ клинических показателей и развитие практики непрерывного улучшения",
  "Организация обучающих программ, семинаров и консультаций для руководителей и специалистов",
  "Повышение международной конкурентоспособности клиник и расширение возможностей медицинского туризма",
];

/** The ACHSI partnership news: the photos stay pinned beside the story while its parts rise in one by one. */
export function AchsiPartner() {
  return (
    <section id="achsi" className="achsi">
      <PhotoSlides photos={PHOTOS} className="achsi-photos" />

      <div className="achsi-story">
        <Reveal>
          <p className="achsi-eyebrow">Партнёрство · Абу-Даби, 20–22 октября</p>
          <h2>Ассоциация медицинских организаций стала эксклюзивным партнёром ACHSI в Узбекистане</h2>
        </Reveal>
        <Reveal className="achsi-lead">
          20–22 октября в Абу-Даби в рамках Future Health Summit между Ассоциацией медицинских организаций Узбекистана
          и австралийской организацией Australian Council on Healthcare Standards International (ACHSI) подписан
          меморандум о сотрудничестве.
        </Reveal>
        <Reveal className="achsi-text">
          Согласно меморандуму, Ассоциация теперь является эксклюзивным партнёром ACHSI в Узбекистане. Документ
          предусматривает сотрудничество в подготовке государственных и частных медицинских организаций к
          международной аккредитации, повышении качества медицинских услуг и обеспечении безопасности пациентов.
        </Reveal>

        <Reveal>
          <h3 className="achsi-list-title">Основные направления сотрудничества</h3>
        </Reveal>
        <RevealGroup className="achsi-list" role="list">
          {DIRECTIONS.map((text) => (
            <motion.div key={text} role="listitem" variants={revealItem}>
              <span className="achsi-check" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              </span>
              {text}
            </motion.div>
          ))}
        </RevealGroup>

        <Reveal className="achsi-note">
          <strong>Справка</strong>
          ACHSI создана в 2005 году Австралийским советом по стандартам здравоохранения (ACHS). Организация
          специализируется на оценке и аккредитации медицинских учреждений по международным стандартам.
        </Reveal>
      </div>
    </section>
  );
}

