import { useRef, type ReactNode } from "react";
import { MOTION_OK, gsap, useGSAP } from "@/shared/lib/gsap";
import { useLang, type Text } from "@/shared/i18n/lang";

// The association's contacts, as published on uztta.uz; the section follows that site's contacts block.
const line = (shape: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {shape}
  </svg>
);

const CONTACTS: { label: Text; value: Text; href: string; external?: boolean; icon: ReactNode }[] = [
  {
    label: { ru: "Телефон", uz: "Telefon", en: "Phone" },
    value: { ru: "+998 90 927 90 07", uz: "+998 90 927 90 07", en: "+998 90 927 90 07" },
    href: "tel:+998909279007",
    icon: line(
      <path d="M8.2 3.8 6 4c-1.2.1-2.2 1.2-2 2.4.8 6.9 6.6 12.8 13.6 13.6 1.2.1 2.3-.8 2.4-2l.2-2.2a1.5 1.5 0 0 0-1-1.5l-2.8-1a1.5 1.5 0 0 0-1.6.4l-1.1 1.2a10.3 10.3 0 0 1-4.9-4.9l1.2-1.1c.4-.4.6-1 .4-1.6l-1-2.8a1.5 1.5 0 0 0-1.5-1Z" />,
    ),
  },
  {
    label: { ru: "Email", uz: "Email", en: "Email" },
    value: { ru: "info@uztta.uz", uz: "info@uztta.uz", en: "info@uztta.uz" },
    href: "mailto:info@uztta.uz",
    icon: line(
      <>
        <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path d="m4 7.5 8 5.5 8-5.5" />
      </>,
    ),
  },
  {
    label: { ru: "Telegram", uz: "Telegram", en: "Telegram" },
    value: { ru: "Написать в Telegram", uz: "Telegramda yozish", en: "Message on Telegram" },
    href: "https://t.me/fkamiloovash",
    external: true,
    icon: line(<path d="M20.5 3.6 3.8 10.3c-.8.3-.8 1.4 0 1.7l4.3 1.6 1.6 5c.3.8 1.3 1 1.8.4l2.4-2.5 4.3 3.2c.6.5 1.6.1 1.7-.7L22 4.8c.2-.9-.7-1.6-1.5-1.2ZM8.1 13.6 18 6.9l-7.6 8" />),
  },
  {
    label: { ru: "Instagram", uz: "Instagram", en: "Instagram" },
    value: { ru: "@uz_tta", uz: "@uz_tta", en: "@uz_tta" },
    href: "https://www.instagram.com/uz_tta/",
    external: true,
    icon: line(
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="3.8" />
        <path d="M17 7h.01" strokeWidth="2.4" />
      </>,
    ),
  },
];

/** Contacts, right before the footer, laid out as on uztta.uz: a small label and the heading (its last words light,
 *  in the logo gradient), then four white cards in a row: an icon tile and a corner arrow on top, the channel and its
 *  value at the bottom. They rise in once when the section comes into view. */
export function Contacts() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from([".contacts-head > *", ".contact-card"], {
          y: 32,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 78%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="contacts" className="contacts" aria-labelledby="contacts-title">
      <div className="wrap">
        <div className="contacts-head">
          <p className="contacts-kicker">{t({ ru: "Контакты", uz: "Kontaktlar", en: "Contacts" })}</p>
          <h2 id="contacts-title" className="contacts-title">
            {lang === "uz" ? (
              <>
                Biz bilan <em>bogʻlaning</em>
              </>
            ) : lang === "en" ? (
              <>
                Get <em>in touch</em>
              </>
            ) : (
              <>
                Свяжитесь <em>с нами</em>
              </>
            )}
          </h2>
        </div>

        <ul className="contacts-grid">
          {CONTACTS.map((item) => (
            <li key={item.href}>
              <a className="contact-card" href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <span className="contact-card-top">
                  <span className="contact-card-icon">{item.icon}</span>
                  <svg className="contact-card-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M8.5 7H17v8.5" />
                  </svg>
                </span>
                <span className="contact-card-text">
                  <span className="contact-card-label">{t(item.label)}</span>
                  <strong className="contact-card-value">{t(item.value)}</strong>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
