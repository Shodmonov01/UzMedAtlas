import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { MOTION_OK, glideTo, gsap, useGSAP } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { useLang } from "@/shared/i18n/lang";

/** Site footer on white: the brand with a way back to the top, then the mission, two link columns and the
 *  invitation for clinics on one row (rising in the first time they scroll into view), and the fine print.
 *  Link hovers only darken the text. */
export function Footer() {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();
  const brand = t({ ru: "Ассоциация медицинских организаций", uz: "Tibbiyot tashkilotlari assotsiatsiyasi", en: "Association of Medical Organizations" });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".site-footer-grid > *", {
          y: 32,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <Link to="/" className="site-footer-brand">
            <img src="/brand/logo.svg" alt="" width={44} height={44} />
            <span>
              <strong>{t({ ru: "Ассоциация", uz: "Assotsiatsiya", en: "Association" })}</strong>
              <span>{t({ ru: "медицинских организаций", uz: "tibbiyot tashkilotlari", en: "of Medical Organizations" })}</span>
            </span>
          </Link>
          <button type="button" className="site-footer-up" onClick={() => glideTo(0)}>
            {t({ ru: "Наверх", uz: "Yuqoriga", en: "Back to top" })}
            <span>
              <ArrowIcon />
            </span>
          </button>
        </div>

        <div className="site-footer-grid">
          <p className="site-footer-about">
            {t({
              ru: "Помогаем сориентироваться в клиниках Узбекистана и найти подходящее направление лечения.",
              uz: "Oʻzbekiston klinikalarida yoʻl topishga va mos davolash yoʻnalishini tanlashga yordam beramiz.",
              en: "We help you find your way among Uzbekistan's clinics and choose the right course of treatment.",
            })}
          </p>

          <nav className="site-footer-col" aria-label={t({ ru: "Пациентам", uz: "Bemorlarga", en: "For patients" })}>
            <p>{t({ ru: "Пациентам", uz: "Bemorlarga", en: "For patients" })}</p>
            <a href="/#medtourism">{t({ ru: "Медицинский туризм", uz: "Tibbiy turizm", en: "Medical tourism" })}</a>
            <a href="/#catalog">{t({ ru: "Каталог клиник", uz: "Klinikalar katalogi", en: "Clinic catalog" })}</a>
            <Link to="/checker">{t({ ru: "Подобрать направление", uz: "Yoʻnalish tanlash", en: "Find a specialty" })}</Link>
          </nav>

          <nav className="site-footer-col" aria-label={t({ ru: "Клиникам", uz: "Klinikalarga", en: "For clinics" })}>
            <p>{t({ ru: "Клиникам", uz: "Klinikalarga", en: "For clinics" })}</p>
            <Link to="/cabinet/login">{t({ ru: "Личный кабинет", uz: "Shaxsiy kabinet", en: "Clinic account" })}</Link>
            <Link to="/moderation/login">{t({ ru: "Кабинет модератора", uz: "Moderator kabineti", en: "Moderator account" })}</Link>
          </nav>

          <div className="site-footer-cta">
            <p className="site-footer-cta-title">{t({ ru: "Вы представляете клинику?", uz: "Siz klinika vakilimisiz?", en: "Do you represent a clinic?" })}</p>
            <p>{t({ ru: "Разместите клинику в каталоге и получайте заявки от пациентов.", uz: "Klinikangizni katalogga joylang va bemorlardan arizalar oling.", en: "List your clinic in the catalog and receive requests from patients." })}</p>
            <Link to="/cabinet/login" className="pill-btn is-ink">
              {t({ ru: "Подключить клинику", uz: "Klinikani ulash", en: "Add your clinic" })}
              <span className="pill-btn-icon">
                <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} {brand}</span>
          <span>{t({ ru: "Health Checker помогает с выбором направления и не ставит диагноз.", uz: "Health Checker yoʻnalish tanlashga yordam beradi va tashxis qoʻymaydi.", en: "Health Checker helps choose a specialty and does not make a diagnosis." })}</span>
        </div>
      </div>
    </footer>
  );
}
