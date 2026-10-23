import { Link } from "@tanstack/react-router";
import { LogoTiles } from "@/shared/ui/LogoTiles";
import { motion } from "motion/react";
import { RevealGroup, revealItem } from "@/shared/ui/Reveal";

export function Footer() {
  return (
    <footer className="site-footer">
      <LogoTiles corner="tr" seed={5} />
      <div className="site-footer-inner">
        <RevealGroup className="site-footer-top">
          <motion.div className="site-footer-about" variants={revealItem}>
            <Link to="/" className="site-footer-brand">
              <img src="/brand/logo.svg" alt="" width={44} height={44} />
              <span>
                <strong>Ассоциация</strong>
                <span>медицинских организаций</span>
              </span>
            </Link>
            <p>Помогаем сориентироваться в клиниках Узбекистана и найти подходящее направление лечения.</p>
          </motion.div>

          <motion.nav className="site-footer-links" aria-label="Разделы сайта" variants={revealItem}>
            <div>
              <p>Пациентам</p>
              <a href="/#catalog">Каталог клиник</a>
              <Link to="/checker">Подобрать направление</Link>
            </div>
            <div>
              <p>Клиникам</p>
              <Link to="/cabinet/login">Личный кабинет</Link>
              <Link to="/moderation/login">Кабинет модератора</Link>
            </div>
          </motion.nav>

          <motion.div className="site-footer-cta" variants={revealItem}>
            <p className="site-footer-cta-title">Вы представляете клинику?</p>
            <p>Разместите клинику в каталоге и получайте заявки от пациентов.</p>
            <Link to="/cabinet/login" className="site-footer-cta-action">
              Подключить клинику
              <span aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </motion.div>
        </RevealGroup>

        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} Ассоциация медицинских организаций</span>
          <span>Health Checker помогает с выбором направления и не ставит диагноз.</span>
        </div>
      </div>
    </footer>
  );
}
