import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { PhotoLightbox, type GalleryPhoto } from "@/shared/ui/PhotoCarousel";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { MOTION_OK, gsap, useGSAP } from "@/shared/lib/gsap";
import { pickName, useLang, type Lang, type Text } from "@/shared/i18n/lang";

/** Building blocks shared by the public clinic page and its branch pages, so both read as one design. */

export function socialHref(kind: "telegram" | "instagram" | "whatsapp", value: string) {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  if (kind === "telegram") return `https://t.me/${handle}`;
  if (kind === "instagram") return `https://instagram.com/${handle}`;
  return `https://wa.me/${v.replace(/\D/g, "")}`;
}

/** "https://t.me/sinomed_uz" → "@sinomed_uz"; a phone or a handle stays as typed. */
export function socialLabel(value: string) {
  const v = value.trim();
  const path = v.match(/^https?:\/\/(?:www\.)?[^/]+\/([^/?#]+)/i)?.[1];
  return path ? `@${path}` : v;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toUpperCase())
    .join("");
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

const ICONS = {
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3",
  send: "M21 4 3 11l6 2.5M21 4l-4 16-8-6.5M21 4 9 13.5V19l3-3",
  camera: "M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7M17 7h.01",
  chat: "M4 20l1.4-4.2A8 8 0 1 1 8.4 18.7z",
  play: "M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9l5 3-5 3z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
  pin: "M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21ZM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5",
  photos: "M4 6h16v12H4zM4 15l4-4 4 4 3-3 5 5",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M6 15V9a4 4 0 0 1 4-4h4M18 9v6a4 4 0 0 1-4 4h-4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4",
  file: "M7 3h7l5 5v13H7zM14 3v5h5",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={ICONS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A section of the page: a small blue label over a large heading (with an optional count), then its content. */
export function ProfileSection({
  id,
  kicker,
  title,
  count,
  aside,
  children,
}: {
  id?: string;
  kicker?: string;
  title: string;
  count?: number;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="cp-section">
      <div className="cp-section-head">
        <div>
          {kicker ? <p className="cp-kicker">{kicker}</p> : null}
          <h2 className="cp-h2">
            {title}
            {count ? <span>{count}</span> : null}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Up to three photos beside the hero text; the last one opens the full set. */
export function PhotoMosaic({ photos }: { photos: GalleryPhoto[] }) {
  const { t } = useLang();
  const [index, setIndex] = useState<number | null>(null);
  const shown = photos.slice(0, 3);
  return (
    <>
      <div className={`clinic-mosaic has-${shown.length}`}>
        {shown.map((photo, i) => (
          <button key={photo.id} type="button" aria-label={`${t({ ru: "Открыть фото", uz: "Rasmni ochish", en: "Open photo" })} ${i + 1}`} onClick={() => setIndex(i)}>
            <FitImage src={photo.url} alt={photo.alt} tolerance={0.2} loading={i === 0 ? "eager" : "lazy"} />
            {i === shown.length - 1 && photos.length > 1 ? (
              <span className="clinic-mosaic-all">
                <Icon name="photos" size={16} />
                {t({ ru: "Все фото", uz: "Barcha rasmlar", en: "All photos" })} · {photos.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <PhotoLightbox photos={photos} index={index} onIndexChange={setIndex} />
    </>
  );
}

export type ProfileDoctor = {
  id: string;
  nameRu?: string;
  nameEn: string;
  roleRu?: string;
  roleEn?: string;
  bioRu?: string;
  bioEn?: string;
  photoUrl?: string | null;
  experienceYears?: number | string | null;
  category?: string;
  certsRu?: string;
  certsEn?: string;
  continuingEducationRu?: string;
  internationalExperienceRu?: string;
  researchActivityRu?: string;
  awardsRu?: string;
  achievementsRu?: string;
};

const CATEGORY_LABELS: Record<string, Text> = {
  highest: { ru: "высшая категория", uz: "oliy toifa", en: "top category" },
  first: { ru: "первая категория", uz: "birinchi toifa", en: "first category" },
  second: { ru: "вторая категория", uz: "ikkinchi toifa", en: "second category" },
};

const DOCTORS_PREVIEW = 6;

function doctorDetails(d: ProfileDoctor, lang: Lang): { label: string; value: string }[] {
  const L = (text: Text) => text[lang];
  const details: { label: string; value?: string }[] = [
    { label: L({ ru: "Квалификация", uz: "Malaka", en: "Qualifications" }), value: lang === "en" ? d.certsEn || d.certsRu : d.certsRu || d.certsEn },
    { label: L({ ru: "Повышение квалификации", uz: "Malaka oshirish", en: "Further training" }), value: d.continuingEducationRu },
    { label: L({ ru: "Опыт за рубежом", uz: "Xorijdagi tajriba", en: "Experience abroad" }), value: d.internationalExperienceRu },
    { label: L({ ru: "Научная работа", uz: "Ilmiy faoliyat", en: "Research" }), value: d.researchActivityRu },
    { label: L({ ru: "Награды", uz: "Mukofotlar", en: "Awards" }), value: d.awardsRu },
    { label: L({ ru: "Достижения", uz: "Yutuqlar", en: "Achievements" }), value: d.achievementsRu },
  ];
  return details.filter((item): item is { label: string; value: string } => Boolean(item.value?.trim()));
}

/** Doctors as portrait cards, six at first; the long credentials fold away under "More". */
export function DoctorList({ doctors }: { doctors: ProfileDoctor[] }) {
  const { lang, t } = useLang();
  const [all, setAll] = useState(false);
  const shown = all ? doctors : doctors.slice(0, DOCTORS_PREVIEW);
  return (
    <>
      <ul className="cp-people">
        {shown.map((d) => {
          const name = pickName(lang, d.nameRu, d.nameEn);
          const role = pickName(lang, d.roleRu, d.roleEn);
          const bio = pickName(lang, d.bioRu, d.bioEn);
          const details = doctorDetails(d, lang);
          const years = d.experienceYears != null && d.experienceYears !== "" ? d.experienceYears : null;
          return (
            <li key={d.id} className="cp-person">
              <span className="cp-avatar">{d.photoUrl ? <img src={d.photoUrl} alt="" loading="lazy" /> : initials(name)}</span>
              <div className="cp-person-body">
                <h3>{name}</h3>
                {role ? <p className="cp-person-role">{role}</p> : null}
                {years || d.category ? (
                  <div className="cp-person-tags">
                    {years ? <span className="is-accent">{t({ ru: `опыт ${years} лет`, uz: `${years} yil tajriba`, en: `${years} years of practice` })}</span> : null}
                    {d.category ? <span>{CATEGORY_LABELS[d.category] ? t(CATEGORY_LABELS[d.category]) : d.category}</span> : null}
                  </div>
                ) : null}
                {bio ? <p className="cp-person-bio">{bio}</p> : null}
                {details.length ? (
                  <details className="cp-more">
                    <summary>{t({ ru: "Подробнее о враче", uz: "Shifokor haqida batafsil", en: "More about the doctor" })}</summary>
                    <dl>
                      {details.map(({ label, value }) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {doctors.length > DOCTORS_PREVIEW ? (
        <button type="button" className="pill-btn is-outline cp-show-all" onClick={() => setAll((v) => !v)}>
          {all
            ? t({ ru: "Свернуть", uz: "Yigʻish", en: "Show fewer" })
            : t({ ru: `Показать всех специалистов · ${doctors.length}`, uz: `Barcha mutaxassislar · ${doctors.length}`, en: `Show all specialists · ${doctors.length}` })}
        </button>
      ) : null}
    </>
  );
}

/** A person card for the founder or the leadership. */
export function PersonCard({ name, role, bio, photoUrl, wide }: { name: string; role?: string | null; bio?: string | null; photoUrl?: string | null; wide?: boolean }) {
  return (
    <li className={`cp-person${wide ? " is-wide" : ""}`}>
      <span className="cp-avatar">{photoUrl ? <img src={photoUrl} alt="" loading="lazy" /> : initials(name)}</span>
      <div className="cp-person-body">
        <h3>{name}</h3>
        {role ? <p className="cp-person-role">{role}</p> : null}
        {bio ? <p className="cp-person-bio">{bio}</p> : null}
      </div>
    </li>
  );
}

type Service = {
  id: string;
  nameRu?: string;
  nameEn: string;
  descriptionRu?: string;
  descriptionEn?: string;
  priceUsd?: number | null;
  currency?: string;
  unit?: string;
};

/** A service price in the reader's language: "$120", "500 000 сум / приём", "500 000 soʻm". */
export function servicePrice(s: Service, lang: Lang) {
  if (s.priceUsd == null) return null;
  const amount = s.priceUsd.toLocaleString("ru-RU");
  const unit = s.unit ? ` / ${s.unit}` : "";
  if (s.currency === "USD") return `$${amount}${unit}`;
  return `${amount} ${lang === "uz" ? "soʻm" : lang === "en" ? "UZS" : "сум"}${unit}`;
}

const SERVICES_PREVIEW = 8;

/** Services and prices as rows in one card; a search pill above when there are many, the first eight at first. */
export function ServicesList({ services }: { services: Service[] }) {
  const { lang, t } = useLang();
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const needle = q.trim().toLowerCase();
  const found = useMemo(
    () => (needle ? services.filter((s) => `${s.nameRu || ""} ${s.nameEn} ${s.descriptionRu || ""} ${s.descriptionEn || ""}`.toLowerCase().includes(needle)) : services),
    [needle, services],
  );
  const shown = all || needle ? found : found.slice(0, SERVICES_PREVIEW);
  return (
    <>
      {services.length > SERVICES_PREVIEW ? (
        <label className="cp-search">
          <Icon name="search" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t({ ru: "Найти услугу", uz: "Xizmatni topish", en: "Find a service" })}
            aria-label={t({ ru: "Поиск по услугам", uz: "Xizmatlar boʻyicha qidiruv", en: "Search services" })}
          />
        </label>
      ) : null}
      <ul className="cp-services">
        {shown.map((s) => {
          const price = servicePrice(s, lang);
          const description = pickName(lang, s.descriptionRu, s.descriptionEn);
          return (
            <li key={s.id} className="cp-service">
              <div>
                <h3>{pickName(lang, s.nameRu, s.nameEn)}</h3>
                {description ? <p>{description}</p> : null}
              </div>
              <span className={`cp-price${price ? "" : " is-ask"}`}>{price || t({ ru: "Цена по запросу", uz: "Narx soʻrov boʻyicha", en: "Price on request" })}</span>
            </li>
          );
        })}
        {!shown.length ? <li className="cp-services-empty">{t({ ru: "Ничего не нашлось", uz: "Hech narsa topilmadi", en: "Nothing found" })}</li> : null}
      </ul>
      {!needle && found.length > SERVICES_PREVIEW ? (
        <button type="button" className="pill-btn is-outline cp-show-all" onClick={() => setAll((v) => !v)}>
          {all
            ? t({ ru: "Свернуть", uz: "Yigʻish", en: "Show fewer" })
            : t({ ru: `Все услуги · ${found.length}`, uz: `Barcha xizmatlar · ${found.length}`, en: `All services · ${found.length}` })}
        </button>
      ) : null}
    </>
  );
}

export type ContactCardProps = {
  logoUrl?: string | null;
  name: string;
  /** Small caps line above the name. */
  label?: string;
  phones?: string[];
  email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  socials?: { label: string; url: string }[];
  responseHours?: number | null;
  /** Extra rows at the end (opening hours, coordinator…). */
  children?: ReactNode;
};

/** The ink contacts card: every way to reach the clinic, each one a row with an icon disc. */
export function ContactCard({
  logoUrl,
  name,
  label,
  phones = [],
  email,
  website,
  whatsapp,
  telegram,
  instagram,
  youtube,
  socials = [],
  responseHours,
  children,
}: ContactCardProps) {
  const { t } = useLang();
  const covered = new Set(
    [whatsapp && "whatsapp", telegram && "telegram", instagram && "instagram", youtube && "youtube"].filter(Boolean),
  );
  const extra = socials.filter((s) => s.label?.trim() && s.url?.trim() && !covered.has(s.label.trim().toLowerCase()));
  return (
    <div id="contacts" className="cp-contact">
      <div className="cp-contact-head">
        <ClinicLogo src={logoUrl} name={name} className="h-12 w-12 rounded-2xl" />
        <div className="min-w-0">
          <small>{label || t({ ru: "Контакты", uz: "Aloqa", en: "Contacts" })}</small>
          <strong>{name}</strong>
        </div>
      </div>
      <div className="cp-contact-rows">
        {phones.map((phone, index) => (
          <a key={phone} href={telHref(phone)} className={`cp-contact-row${index === 0 ? " is-main" : ""}`}>
            <i>
              <Icon name="phone" />
            </i>
            <span>{phone}</span>
          </a>
        ))}
        {email ? (
          <a href={`mailto:${email}`} className="cp-contact-row">
            <i>
              <Icon name="mail" />
            </i>
            <span>{email}</span>
          </a>
        ) : null}
        {website ? (
          <a href={/^https?:\/\//i.test(website) ? website : `https://${website}`} target="_blank" rel="noreferrer" className="cp-contact-row">
            <i>
              <Icon name="globe" />
            </i>
            <span>{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          </a>
        ) : null}
        {whatsapp ? (
          <a href={socialHref("whatsapp", whatsapp)} target="_blank" rel="noreferrer" className="cp-contact-row">
            <i>
              <Icon name="chat" />
            </i>
            <span>WhatsApp · {socialLabel(whatsapp)}</span>
          </a>
        ) : null}
        {telegram ? (
          <a href={socialHref("telegram", telegram)} target="_blank" rel="noreferrer" className="cp-contact-row">
            <i>
              <Icon name="send" />
            </i>
            <span>Telegram · {socialLabel(telegram)}</span>
          </a>
        ) : null}
        {instagram ? (
          <a href={socialHref("instagram", instagram)} target="_blank" rel="noreferrer" className="cp-contact-row">
            <i>
              <Icon name="camera" />
            </i>
            <span>Instagram · {socialLabel(instagram).replace(/^@?/, "@")}</span>
          </a>
        ) : null}
        {youtube ? (
          <a href={youtube} target="_blank" rel="noreferrer" className="cp-contact-row">
            <i>
              <Icon name="play" />
            </i>
            <span>YouTube</span>
          </a>
        ) : null}
        {extra.map((social) => (
          <a key={social.url} href={social.url} target="_blank" rel="noreferrer" className="cp-contact-row">
            <i>
              <Icon name="link" />
            </i>
            <span>{social.label}</span>
          </a>
        ))}
        {responseHours ? (
          <p className="cp-contact-row">
            <i>
              <Icon name="clock" />
            </i>
            <span>{t({ ru: `Отвечают примерно за ${responseHours} ч`, uz: `Taxminan ${responseHours} soatda javob berishadi`, en: `Usually reply within ${responseHours} h` })}</span>
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Wide screens: once the form and the contacts have scrolled away, a small card rides along in the side column with
 *  the request button and the phone, so getting in touch is always one click away. */
export function QuickContact({
  name,
  phone,
  whatsapp,
  telegram,
  responseHours,
  cta,
}: {
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  responseHours?: number | null;
  cta: string;
}) {
  const { t } = useLang();
  return (
    <div className="cp-quick">
      <div className="cp-quick-card">
        <p className="cp-label">{t({ ru: "Связаться с клиникой", uz: "Klinika bilan bogʻlanish", en: "Contact the clinic" })}</p>
        <p className="cp-quick-name">{name}</p>
        {responseHours ? (
          <p className="cp-quick-note">
            <Icon name="clock" size={15} />
            {t({ ru: `Отвечают примерно за ${responseHours} ч`, uz: `Taxminan ${responseHours} soatda javob berishadi`, en: `Usually reply within ${responseHours} h` })}
          </p>
        ) : null}
        <a href="#lead" className="pill-btn is-ink">
          {cta}
          <span className="pill-btn-icon">
            <ArrowIcon />
          </span>
        </a>
        {phone || whatsapp || telegram ? (
          <div className="cp-quick-row">
            {phone ? (
              <a href={telHref(phone)} className="cp-quick-phone">
                <Icon name="phone" size={17} />
                {phone}
              </a>
            ) : null}
            {whatsapp ? (
              <a href={socialHref("whatsapp", whatsapp)} target="_blank" rel="noreferrer" className="cp-quick-icon" aria-label="WhatsApp">
                <Icon name="chat" size={18} />
              </a>
            ) : null}
            {telegram ? (
              <a href={socialHref("telegram", telegram)} target="_blank" rel="noreferrer" className="cp-quick-icon" aria-label="Telegram">
                <Icon name="send" size={18} />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export type BarSection = { id: string; label: string; count?: number };

/** The section bar: glued under the site header, the current section on ink (followed while scrolling), and the
 *  request button at the end. It turns white once it sticks. */
export function SectionBar({ sections, cta }: { sections: BarSection[]; cta: string }) {
  const bar = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLElement>(null);
  const [active, setActive] = useState(sections[0]?.id || "");
  const [stuck, setStuck] = useState(false);
  const ids = sections.map((section) => section.id).join(" ");

  useEffect(() => {
    const list = ids.split(" ").filter(Boolean);
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = bar.current;
      if (!el) return;
      const top = parseFloat(getComputedStyle(el).top) || 0;
      const box = el.getBoundingClientRect();
      setStuck(box.top <= top + 1);
      const line = box.bottom + 40;
      let current = list[0] || "";
      for (const id of list) {
        const target = document.getElementById(id);
        if (target && target.getBoundingClientRect().top <= line) current = id;
      }
      // At the very bottom the last section is the current one, even when it is too short to reach the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = list[list.length - 1] || current;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids]);

  // Keep the current pill in view in the sideways row on phones.
  useEffect(() => {
    const row = tabs.current;
    const link = row?.querySelector<HTMLElement>("a.is-active");
    if (!row || !link) return;
    const left = link.offsetLeft - row.clientWidth / 2 + link.offsetWidth / 2;
    row.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <div ref={bar} className={`cp-bar${stuck ? " is-stuck" : ""}`}>
      <div className="wrap cp-bar-inner">
        <nav ref={tabs} className="cp-tabs" aria-label="Sections">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className={active === section.id ? "is-active" : undefined} aria-current={active === section.id ? "true" : undefined}>
              {section.label}
              {section.count ? <b>{section.count}</b> : null}
            </a>
          ))}
        </nav>
        <a href="#lead" className="cp-bar-cta">
          {cta}
          <span>
            <ArrowIcon size={15} />
          </span>
        </a>
      </div>
    </div>
  );
}

/** Phones and tablets: the request button (and a call button) docked along the bottom edge. It steps aside while the
 *  form itself is on screen, and the Health Checker bubble moves up above it. */
export function MobileDock({ cta, phone }: { cta: string; phone?: string | null }) {
  const { t } = useLang();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add("has-cp-dock");
    const form = document.getElementById("lead");
    let observer: IntersectionObserver | null = null;
    if (form && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0.15 });
      observer.observe(form);
    }
    return () => {
      document.documentElement.classList.remove("has-cp-dock");
      observer?.disconnect();
    };
  }, []);
  return (
    <div className={`cp-dock${hidden ? " is-hidden" : ""}`}>
      <a href="#lead" className="pill-btn is-ink">
        {cta}
        <span className="pill-btn-icon">
          <ArrowIcon />
        </span>
      </a>
      {phone ? (
        <a href={telHref(phone)} className="cp-dock-call" aria-label={t({ ru: "Позвонить", uz: "Qoʻngʻiroq qilish", en: "Call" })}>
          <Icon name="phone" size={20} />
        </a>
      ) : null}
    </div>
  );
}

/** The hero comes in once, when the page has its data: the copy rises line by line, the photos settle into place.
 *  With reduced motion it is simply there. */
export function useHeroIntro(scope: RefObject<HTMLElement | null>, ready: boolean) {
  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".cp-hero-copy > *", { y: 26, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.07, clearProps: "all" });
        gsap.from(".cp-hero-media", { scale: 0.96, autoAlpha: 0, duration: 1.2, ease: "expo.out", clearProps: "all" });
      });
    },
    { scope, dependencies: [ready] },
  );
}

/** Loading and not-found states in the page's look. */
export function PageState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="wrap cp-state">
      <h1>{title}</h1>
      {text ? <p>{text}</p> : null}
      {action}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="wrap" aria-busy="true">
      <div className="cp-crumbs">&nbsp;</div>
      <div className="cp-skeleton">
        <div />
        <div />
      </div>
    </div>
  );
}
