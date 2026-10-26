import { motion } from "motion/react";
import { LogoTiles } from "@/shared/ui/LogoTiles";
import { Reveal, RevealGroup, revealItem } from "@/shared/ui/Reveal";

// Presidential acts on private medicine, each linked to its official text on president.uz.
const ACTS = [
  {
    kind: "Указ",
    title:
      "О мерах по дополнительной поддержке частного сектора в сфере медицины",
    image: "/images/legal-acts/act-1.jpg",
    href: "https://president.uz/oz/lists/view/9178",
  },
  {
    kind: "Постановление",
    title:
      "О дополнительных мерах по повышению качества услуг, оказываемых в сфере медицины",
    image: "/images/legal-acts/act-2.jpg",
    href: "https://president.uz/oz/lists/view/9179",
  },
  {
    kind: "Указ",
    title:
      "О мерах по повышению эффективности управления в системе здравоохранения",
    image: "/images/legal-acts/act-3.jpg",
    href: "https://president.uz/oz/lists/view/9180",
  },
];

export function LegalActs() {
  return (
    <section id="legal-acts" className="legal-acts">
      <LogoTiles corner="tr" seed={23} />
      <LogoTiles corner="bl" seed={7} />
      <div className="legal-acts-inner">
        <Reveal className="legal-acts-head">
          <p className="legal-acts-eyebrow">Нормативная база</p>
          <h2>Документы Президента Республики Узбекистан</h2>
        </Reveal>
        <RevealGroup className="legal-acts-grid" role="list">
          {ACTS.map((act) => (
            <motion.a
              key={act.href}
              role="listitem"
              variants={revealItem}
              href={act.href}
              target="_blank"
              rel="noopener noreferrer"
              className="legal-act"
            >
              <img
                src={act.image}
                alt=""
                decoding="async"
                width={960}
                height={621}
                className="legal-act-image"
              />
              <span className="legal-act-body">
                <span className="legal-act-kind">
                  {act.kind} Президента Республики Узбекистан
                </span>
                <strong className="legal-act-title">«{act.title}»</strong>
                <span className="legal-act-link">
                  Читать на president.uz
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </span>
              </span>
            </motion.a>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
