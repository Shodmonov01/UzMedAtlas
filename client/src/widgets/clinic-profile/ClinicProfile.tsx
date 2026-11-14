import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  AirplaneTilt,
  BookOpenText,
  Briefcase,
  Buildings,
  CalendarBlank,
  CaretRight,
  Check,
  Clock,
  Cpu,
  Envelope,
  FileText,
  Globe,
  Heart,
  Images,
  Info,
  InstagramLogo,
  LinkSimple,
  MagnifyingGlass,
  MapPin,
  Medal,
  Path,
  Phone,
  SealCheck,
  ShieldCheck,
  Sparkle,
  SquaresFour,
  Star,
  Stethoscope,
  Tag,
  Target,
  TelegramLogo,
  Translate,
  TrendUp,
  UserCircle,
  UsersThree,
  WhatsappLogo,
  YoutubeLogo,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "@phosphor-icons/react";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { BranchMap } from "@/shared/ui/BranchMap";
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

/** "JCI; университетская клиника\n• робот-центр." → ["JCI", "Университетская клиника", "Робот-центр"] */
export function splitPoints(value?: string | null) {
  return (value || "")
    .split(/[;\n]/)
    .map((item) => item.replace(/^[•\-*–]\s*/, "").replace(/\.$/, "").trim())
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));
}

/** Language names in English (the site language). */
const LANGUAGE_NAMES: Record<string, string> = {
  ru: "Russian",
  uz: "Uzbek",
  en: "English",
  tr: "Turkish",
  kz: "Kazakh",
  kk: "Kazakh",
  ky: "Kyrgyz",
  kg: "Kyrgyz",
  tg: "Tajik",
  tj: "Tajik",
  tk: "Turkmen",
  ko: "Korean",
  kr: "Korean",
  zh: "Chinese",
  cn: "Chinese",
  hi: "Hindi",
  ar: "Arabic",
  fa: "Persian",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  he: "Hebrew",
  az: "Azerbaijani",
};

export function languageName(code: string) {
  return LANGUAGE_NAMES[code.toLowerCase()] || code.toUpperCase();
}

/** Smooth, rounded icons in the iOS manner (Phosphor): plain strokes next to text, two-tone inside the tiles. */
const ICONS = {
  phone: Phone,
  mail: Envelope,
  globe: Globe,
  send: TelegramLogo,
  camera: InstagramLogo,
  chat: WhatsappLogo,
  play: YoutubeLogo,
  link: LinkSimple,
  clock: Clock,
  pin: MapPin,
  photos: Images,
  route: Path,
  check: Check,
  search: MagnifyingGlass,
  file: FileText,
  calendar: CalendarBlank,
  users: UsersThree,
  stethoscope: Stethoscope,
  building: Buildings,
  grid: SquaresFour,
  target: Target,
  book: BookOpenText,
  star: Star,
  plane: AirplaneTilt,
  trend: TrendUp,
  shield: ShieldCheck,
  award: Medal,
  seal: SealCheck,
  cpu: Cpu,
  sparkle: Sparkle,
  heart: Heart,
  briefcase: Briefcase,
  tag: Tag,
  info: Info,
  chevron: CaretRight,
  user: UserCircle,
  translate: Translate,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS;

/** Small icons get the bold weight so they stay crisp; tiles pass "duotone". */
export function Icon({ name, size = 18, weight }: { name: IconName; size?: number; weight?: IconWeight }) {
  const Glyph = ICONS[name];
  return <Glyph size={size} weight={weight || (size <= 16 ? "bold" : "regular")} aria-hidden="true" />;
}

/** A section of the page: an icon tile beside a small blue label over a large heading (with an optional count). */
export function ProfileSection({
  id,
  icon,
  kicker,
  title,
  count,
  aside,
  children,
}: {
  id?: string;
  icon?: IconName;
  kicker?: string;
  title: string;
  count?: number;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="cp-section">
      <div className="cp-section-head">
        <div className="cp-section-title">
          {icon ? (
            <span className="cp-section-icon">
              <Icon name={icon} size={24} weight="duotone" />
            </span>
          ) : null}
          <div className="min-w-0">
            {kicker ? <p className="cp-kicker">{kicker}</p> : null}
            <h2 className="cp-h2">
              {title}
              {count ? <span>{count}</span> : null}
            </h2>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** A white card with an icon tile and a small label over its text. */
export function InfoCard({ icon, label, wide, children }: { icon: IconName; label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`cp-card cp-info${wide ? " is-wide" : ""}`}>
      <div className="cp-info-head">
        <span className="cp-tile">
          <Icon name={icon} size={22} weight="duotone" />
        </span>
        <p className="cp-label">{label}</p>
      </div>
      <div className="cp-info-body">{children}</div>
    </div>
  );
}

/** Long text folded to a few lines with a "Read more" toggle. */
export function ReadMore({ text, className = "", limit = 420 }: { text: string; className?: string; limit?: number }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  return (
    <div className="cp-readmore">
      <p className={`${className}${long && !open ? " is-clamped" : ""}`}>{text}</p>
      {long ? (
        <button type="button" className="cp-link-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? t({ ru: "Свернуть", uz: "Yigʻish", en: "Show less" }) : t({ ru: "Читать полностью", uz: "Toʻliq oʻqish", en: "Read more" })}
          <span className={open ? "is-up" : undefined}>
            <Icon name="chevron" size={15} />
          </span>
        </button>
      ) : null}
    </div>
  );
}

/** The photos across the top of the page: one large picture and up to four smaller ones on wide screens,
 *  a swipeable strip with a counter on phones. Any picture opens the full set. */
export function HeroGallery({ photos, fallback }: { photos: GalleryPhoto[]; fallback?: ReactNode }) {
  const { t } = useLang();
  const [index, setIndex] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const shown = photos.slice(0, 5);

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCurrent(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [photos.length]);

  if (!photos.length) return <div className="cp-gallery is-empty">{fallback}</div>;

  const allLabel = `${t({ ru: "Все фото", uz: "Barcha rasmlar", en: "All photos" })} · ${photos.length}`;
  return (
    <>
      <div className={`cp-gallery has-${shown.length}`}>
        {shown.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            className="cp-gallery-cell"
            aria-label={`${t({ ru: "Открыть фото", uz: "Rasmni ochish", en: "Open photo" })} ${i + 1}`}
            onClick={() => setIndex(i)}
          >
            <FitImage src={photo.url} alt={photo.alt} tolerance={0.25} loading={i === 0 ? "eager" : "lazy"} />
          </button>
        ))}
        {photos.length > 1 ? (
          <button type="button" className="cp-gallery-all" onClick={() => setIndex(0)}>
            <Icon name="grid" size={16} />
            {allLabel}
          </button>
        ) : null}
      </div>

      <div className="cp-strip">
        <div ref={strip} className="cp-strip-track">
          {photos.map((photo, i) => (
            <button key={photo.id} type="button" className="cp-strip-cell" aria-label={`${t({ ru: "Открыть фото", uz: "Rasmni ochish", en: "Open photo" })} ${i + 1}`} onClick={() => setIndex(i)}>
              <FitImage src={photo.url} alt={photo.alt} tolerance={0.25} loading={i === 0 ? "eager" : "lazy"} />
            </button>
          ))}
        </div>
        {photos.length > 1 ? (
          <>
            <span className="cp-strip-count" aria-hidden="true">
              <Icon name="photos" size={14} />
              {Math.min(current + 1, photos.length)} / {photos.length}
            </span>
            <span className="cp-strip-dots" aria-hidden="true">
              {photos.slice(0, 8).map((photo, i) => (
                <i key={photo.id} className={i === Math.min(current, 7) ? "is-on" : undefined} />
              ))}
            </span>
          </>
        ) : null}
      </div>
      <PhotoLightbox photos={photos} index={index} onIndexChange={setIndex} />
    </>
  );
}

/** The photo section: a bento grid (one large picture, five smaller; on phones one large and four), the last tile
 *  saying how many more there are. Any tile, or "View all" in the heading, opens the full set. */
export function PhotoSection({ photos, kicker, title }: { photos: GalleryPhoto[]; kicker: string; title: string }) {
  const { t } = useLang();
  const [index, setIndex] = useState<number | null>(null);
  const shown = photos.slice(0, 6);
  const open = t({ ru: "Открыть фото", uz: "Rasmni ochish", en: "Open photo" });
  return (
    <ProfileSection
      icon="photos"
      kicker={kicker}
      title={title}
      count={photos.length}
      aside={
        <button type="button" className="cp-head-btn" onClick={() => setIndex(0)}>
          <Icon name="grid" size={16} />
          {t({ ru: "Смотреть все", uz: "Barchasini koʻrish", en: "View all" })}
        </button>
      }
    >
      <div className="cp-photos">
        {shown.map((photo, i) => {
          // Phones show five tiles, wide screens six: each count gets its own "+N" on its last tile.
          const moreWide = i === 5 && photos.length > 6 ? photos.length - 6 : 0;
          const moreNarrow = i === 4 && photos.length > 5 ? photos.length - 5 : 0;
          return (
            <button key={photo.id} type="button" className="cp-photo" aria-label={`${open} ${i + 1}`} onClick={() => setIndex(i)}>
              <FitImage src={photo.url} alt={photo.alt} tolerance={0.3} />
              {moreWide ? <span className="cp-photo-more is-wide">+{moreWide}</span> : null}
              {moreNarrow ? <span className="cp-photo-more is-narrow">+{moreNarrow}</span> : null}
            </button>
          );
        })}
      </div>
      <PhotoLightbox photos={photos} index={index} onIndexChange={setIndex} />
    </ProfileSection>
  );
}

/** Kept for older imports: the gallery without a fallback. */
export const PhotoMosaic = HeroGallery;

export type HeroStat = { icon: IconName; value: string | number; label: string; href?: string };

/** The key figures beside the name: an icon tile, a large number and its label. */
export function HeroStats({ stats }: { stats: HeroStat[] }) {
  if (!stats.length) return null;
  return (
    <dl className={`cp-stats has-${Math.min(stats.length, 4)}`}>
      {stats.map((stat) => {
        const body = (
          <>
            <span className="cp-tile">
              <Icon name={stat.icon} size={22} weight="duotone" />
            </span>
            <span className="cp-stat-text">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </span>
          </>
        );
        return (
          <div key={stat.label} className="cp-stat">
            <dt className="sr-only">{stat.label}</dt>
            <dd>{stat.href ? <a href={stat.href}>{body}</a> : <span>{body}</span>}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Small facts in one line under the name: an icon, then the words. */
export function MetaLine({ items }: { items: { icon: IconName; text: ReactNode; tone?: "open" | "closed" }[] }) {
  if (!items.length) return null;
  return (
    <ul className="cp-meta">
      {items.map((item, i) => (
        <li key={i} className={item.tone ? `is-${item.tone}` : undefined}>
          <Icon name={item.icon} size={16} />
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
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
  highest: { ru: "Высшая категория", uz: "Oliy toifa", en: "Top category" },
  first: { ru: "Первая категория", uz: "Birinchi toifa", en: "First category" },
  second: { ru: "Вторая категория", uz: "Ikkinchi toifa", en: "Second category" },
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

/** Doctors as portrait cards (photo on top, experience on the photo), six at first; the credentials fold away. */
export function DoctorList({ doctors }: { doctors: ProfileDoctor[] }) {
  const { lang, t } = useLang();
  const [all, setAll] = useState(false);
  const shown = all ? doctors : doctors.slice(0, DOCTORS_PREVIEW);
  return (
    <>
      <ul className="cp-doctors">
        {shown.map((d) => {
          const name = pickName(lang, d.nameRu, d.nameEn);
          const role = pickName(lang, d.roleRu, d.roleEn);
          const bio = pickName(lang, d.bioRu, d.bioEn);
          const details = doctorDetails(d, lang);
          const years = d.experienceYears != null && d.experienceYears !== "" ? d.experienceYears : null;
          return (
            <li key={d.id} className="cp-doctor">
              <div className={`cp-doctor-photo${d.photoUrl ? "" : " is-empty"}`}>
                {d.photoUrl ? <img src={d.photoUrl} alt="" loading="lazy" /> : <span className="cp-doctor-initials">{initials(name)}</span>}
                {years ? (
                  <span className="cp-doctor-badge">
                    <Icon name="briefcase" size={14} />
                    {t({ ru: `${years} лет опыта`, uz: `${years} yil tajriba`, en: `${years} yrs experience` })}
                  </span>
                ) : null}
              </div>
              <div className="cp-doctor-body">
                <h3>{name}</h3>
                <p className="cp-doctor-role">
                  <Icon name="stethoscope" size={15} />
                  <span>{role || " "}</span>
                </p>
                {/* Every card keeps the same rows (empty ones held open), so the cards line up at one height. */}
                <p className={`cp-doctor-cat${d.category ? "" : " is-blank"}`} aria-hidden={d.category ? undefined : true}>
                  <Icon name="award" size={15} />
                  {d.category ? (CATEGORY_LABELS[d.category] ? t(CATEGORY_LABELS[d.category]) : d.category) : " "}
                </p>
                <p className="cp-doctor-bio">{bio || " "}</p>
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

/** A person card for the founder or the leadership: the portrait beside the name, role and story. */
export function PersonCard({ name, role, bio, photoUrl, wide }: { name: string; role?: string | null; bio?: string | null; photoUrl?: string | null; wide?: boolean }) {
  return (
    <li className={`cp-person${wide ? " is-wide" : ""}`}>
      <span className="cp-avatar">{photoUrl ? <img src={photoUrl} alt="" loading="lazy" /> : initials(name)}</span>
      <div className="cp-person-body">
        {role ? <p className="cp-label">{role}</p> : null}
        <h3>{name}</h3>
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
  const amount = s.priceUsd.toLocaleString("en-US");
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
              <span className="cp-service-icon" aria-hidden="true">
                <Icon name="stethoscope" size={20} weight="duotone" />
              </span>
              <div className="cp-service-text">
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

export type EquipmentItem = { id: string; nameRu?: string; nameEn: string; manufacturer?: string; descriptionRu?: string; descriptionEn?: string; photoUrl?: string | null };

/** Equipment as picture cards: the photo on top (or an icon panel), the maker, the name and a few words. */
export function EquipmentGrid({ items }: { items: EquipmentItem[] }) {
  const { lang } = useLang();
  // Without any pictures the cards stay compact: an icon tile beside the words.
  const compact = !items.some((e) => e.photoUrl);
  if (compact) {
    return (
      <FeatureGrid
        icon="cpu"
        items={items.map((e) => ({
          key: e.id,
          label: e.manufacturer || null,
          title: pickName(lang, e.nameRu, e.nameEn),
          text: pickName(lang, e.descriptionRu, e.descriptionEn).trim() || null,
        }))}
      />
    );
  }
  return (
    <ul className="cp-media-grid">
      {items.map((e) => {
        const description = pickName(lang, e.descriptionRu, e.descriptionEn).trim();
        return (
          <li key={e.id} className="cp-media">
            <div className="cp-media-photo">
              {e.photoUrl ? (
                <FitImage src={e.photoUrl} className="absolute inset-0" tolerance={0.25} />
              ) : (
                <span className="cp-media-empty">
                  <Icon name="cpu" size={40} weight="duotone" />
                </span>
              )}
            </div>
            <div className="cp-media-body">
              {e.manufacturer ? <p className="cp-label">{e.manufacturer}</p> : null}
              <h3>{pickName(lang, e.nameRu, e.nameEn)}</h3>
              {description ? <p className="cp-media-text">{description}</p> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Technologies and methods: compact cards with a sparkle tile. */
export function FeatureGrid({ items, icon = "sparkle" }: { items: { key: string; label?: string | null; title: string; text?: string | null }[]; icon?: IconName }) {
  return (
    <ul className="cp-features">
      {items.map((item) => (
        <li key={item.key} className="cp-feature">
          <span className="cp-tile">
            <Icon name={icon} size={22} weight="duotone" />
          </span>
          <div className="min-w-0">
            {item.label ? <p className="cp-label">{item.label}</p> : null}
            <h3>{item.title}</h3>
            {item.text ? <p>{item.text}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Points with a gradient check disc, two to a row. */
export function CheckList({ items, plain }: { items: string[]; plain?: boolean }) {
  return (
    <ul className={`cp-checks${plain ? " is-plain" : ""}`}>
      {items.map((item) => (
        <li key={item}>
          <span>
            <Icon name="check" size={14} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export type Certificate = {
  id: string;
  nameRu?: string;
  nameEn: string;
  issuerRu?: string;
  issuerEn?: string;
  year?: number | null;
  receivedAt?: string | null;
  validUntil?: string | null;
  fileUrl?: string | null;
  imageUrl?: string | null;
};

/** Certificates and licences: the scan (or an award tile), the name, who issued it and the dates. */
export function CertificateList({ items }: { items: Certificate[] }) {
  const { lang, t } = useLang();
  return (
    <ul className="cp-certs">
      {items.map((c) => {
        const issuer = pickName(lang, c.issuerRu, c.issuerEn).trim();
        const issued = c.receivedAt || (c.year ? String(c.year) : null);
        return (
          <li key={c.id} className="cp-cert">
            <div className={`cp-cert-thumb${c.imageUrl ? "" : " is-icon"}`}>{c.imageUrl ? <FitImage src={c.imageUrl} className="absolute inset-0" tolerance={0.4} /> : <Icon name="seal" size={26} weight="duotone" />}</div>
            <div className="cp-cert-body">
              <h3>{pickName(lang, c.nameRu, c.nameEn)}</h3>
              {issuer ? <p>{issuer}</p> : null}
              {issued || c.validUntil ? (
                <div className="cp-cert-dates">
                  {issued ? (
                    <span>
                      <Icon name="calendar" size={13} />
                      {t({ ru: "Получен", uz: "Olingan", en: "Issued" })} {issued}
                    </span>
                  ) : null}
                  {c.validUntil ? (
                    <span>
                      <Icon name="shield" size={13} />
                      {t({ ru: "До", uz: "Amal qiladi", en: "Valid until" })} {c.validUntil}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {c.fileUrl ? (
                <a href={c.fileUrl} target="_blank" rel="noreferrer" className="cp-cert-link">
                  <Icon name="file" size={15} />
                  {t({ ru: "Открыть документ", uz: "Hujjatni ochish", en: "Open document" })}
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Achievements as a timeline: the year on the left, a dot on the line, the story beside it. */
export function Timeline({ items }: { items: { key: string; year?: number | null; title: string; text?: string | null }[] }) {
  return (
    <ol className="cp-timeline">
      {items.map((item) => (
        <li key={item.key}>
          <span className="cp-timeline-year">{item.year || "—"}</span>
          <span className="cp-timeline-dot" aria-hidden="true">
            <Icon name="star" size={13} weight="fill" />
          </span>
          <div className="cp-timeline-body">
            <h3>{item.title}</h3>
            {item.text ? <p>{item.text}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The map in a rounded frame with the address card laid over its corner (under it on phones). */
export function LocationBlock({
  lat,
  lng,
  address,
  routeUrl,
  mapsUrl,
  extra,
}: {
  lat?: number | null;
  lng?: number | null;
  address: string;
  routeUrl?: string | null;
  mapsUrl?: string | null;
  extra?: ReactNode;
}) {
  const { t } = useLang();
  const hasMap = lat != null && lng != null;
  return (
    <div className={`cp-location${hasMap ? "" : " is-plain"}`}>
      {hasMap ? (
        <div className="cp-map">
          <BranchMap mode="view" lat={lat} lng={lng} height={440} className="w-full max-w-full" />
        </div>
      ) : null}
      <div className="cp-address">
        <div className="cp-address-line">
          <span className="cp-tile">
            <Icon name="pin" size={22} weight="duotone" />
          </span>
          <div className="min-w-0">
            <p className="cp-label">{t({ ru: "Адрес", uz: "Manzil", en: "Address" })}</p>
            <p className="cp-address-text">{address}</p>
          </div>
        </div>
        {extra}
        {routeUrl || mapsUrl ? (
          <div className="cp-address-actions">
            {routeUrl ? (
              <a className="pill-btn is-ink" href={routeUrl} target="_blank" rel="noreferrer">
                {t({ ru: "Построить маршрут", uz: "Yoʻnalish qurish", en: "Get directions" })}
                <span className="pill-btn-icon">
                  <Icon name="route" size={17} />
                </span>
              </a>
            ) : null}
            {mapsUrl ? (
              <a className="pill-btn is-outline" href={mapsUrl} target="_blank" rel="noreferrer">
                {t({ ru: "Яндекс Карты", uz: "Yandex Xaritalar", en: "Yandex Maps" })}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
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

function ContactRow({ href, icon, label, value, main, external }: { href?: string; icon: IconName; label: string; value: string; main?: boolean; external?: boolean }) {
  const inner = (
    <>
      <i>
        <Icon name={icon} size={21} weight="duotone" />
      </i>
      <span className="cp-contact-text">
        <small>{label}</small>
        <span>{value}</span>
      </span>
      {href ? (
        <b aria-hidden="true">
          <Icon name="chevron" size={16} />
        </b>
      ) : null}
    </>
  );
  const className = `cp-contact-row${main ? " is-main" : ""}`;
  if (!href) return <p className={className}>{inner}</p>;
  return (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      {inner}
    </a>
  );
}

/** The ink contacts card: every way to reach the clinic, each one a row with an icon tile, what it is and the value. */
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
          <ContactRow key={phone} href={telHref(phone)} icon="phone" label={t({ ru: "Телефон", uz: "Telefon", en: "Phone" })} value={phone} main={index === 0} />
        ))}
        {whatsapp ? <ContactRow href={socialHref("whatsapp", whatsapp)} external icon="chat" label="WhatsApp" value={socialLabel(whatsapp)} /> : null}
        {telegram ? <ContactRow href={socialHref("telegram", telegram)} external icon="send" label="Telegram" value={socialLabel(telegram)} /> : null}
        {email ? <ContactRow href={`mailto:${email}`} icon="mail" label="Email" value={email} /> : null}
        {website ? (
          <ContactRow
            href={/^https?:\/\//i.test(website) ? website : `https://${website}`}
            external
            icon="globe"
            label={t({ ru: "Сайт", uz: "Sayt", en: "Website" })}
            value={website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          />
        ) : null}
        {instagram ? <ContactRow href={socialHref("instagram", instagram)} external icon="camera" label="Instagram" value={socialLabel(instagram).replace(/^@?/, "@")} /> : null}
        {youtube ? <ContactRow href={youtube} external icon="play" label="YouTube" value={socialLabel(youtube)} /> : null}
        {extra.map((social) => (
          <ContactRow key={social.url} href={social.url} external icon="link" label={social.label} value={socialLabel(social.url)} />
        ))}
        {responseHours ? (
          <ContactRow
            icon="clock"
            label={t({ ru: "Скорость ответа", uz: "Javob tezligi", en: "Response time" })}
            value={t({ ru: `Отвечают примерно за ${responseHours} ч`, uz: `Taxminan ${responseHours} soatda`, en: `Within about ${responseHours} h` })}
          />
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
 *  form itself is on screen. */
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

/** The hero comes in once, when the page has its data: the photos settle into place, then the name and the facts
 *  rise line by line. With reduced motion it is simply there. */
export function useHeroIntro(scope: RefObject<HTMLElement | null>, ready: boolean) {
  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out", clearProps: "all" } });
        tl.from(".cp-gallery-cell, .cp-strip, .cp-gallery.is-empty", { y: 24, autoAlpha: 0, duration: 1.1, stagger: 0.06 })
          .from(".cp-id > *", { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.06 }, 0.15)
          .from(".cp-stat", { y: 18, autoAlpha: 0, duration: 0.8, stagger: 0.06 }, 0.3);
      });
    },
    { scope, dependencies: [ready] },
  );
}

/** Loading and not-found states in the page's look. */
export function PageState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="wrap cp-state">
      <span className="cp-tile is-large">
        <Icon name="info" size={30} weight="duotone" />
      </span>
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
        <div className="cp-skeleton-gallery">
          <div />
          <div />
          <div />
        </div>
        <div className="cp-skeleton-lines">
          <div />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}
