import { useState } from "react";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { FitImage } from "@/shared/ui/FitImage";
import { PhotoLightbox, type GalleryPhoto } from "@/shared/ui/PhotoCarousel";

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
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={ICONS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileSection({
  id,
  title,
  count,
  children,
}: {
  id?: string;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-28 space-y-5">
      <h2 className="clinic-section-title flex items-baseline gap-3">
        {title}
        {count ? <span className="text-base font-semibold text-muted">{count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

/** Up to three photos beside the hero text; the last one opens the full set. */
export function PhotoMosaic({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const shown = photos.slice(0, 3);
  return (
    <>
      <div className={`clinic-mosaic has-${shown.length}`}>
        {shown.map((photo, i) => (
          <button key={photo.id} type="button" aria-label={`Открыть фото ${i + 1}`} onClick={() => setIndex(i)}>
            <FitImage src={photo.url} alt={photo.alt} tolerance={0.2} loading={i === 0 ? "eager" : "lazy"} />
            {i === shown.length - 1 && photos.length > 1 ? (
              <span className="clinic-mosaic-all">
                <Icon name="photos" size={16} />
                Все фото · {photos.length}
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

const CATEGORY_LABELS: Record<string, string> = {
  highest: "высшая категория",
  first: "первая категория",
  second: "вторая категория",
};

const DOCTORS_PREVIEW = 6;

function doctorDetails(d: ProfileDoctor): { label: string; value: string }[] {
  const details: { label: string; value?: string }[] = [
    { label: "Квалификация", value: d.certsRu || d.certsEn },
    { label: "Повышение квалификации", value: d.continuingEducationRu },
    { label: "Опыт за рубежом", value: d.internationalExperienceRu },
    { label: "Научная работа", value: d.researchActivityRu },
    { label: "Награды", value: d.awardsRu },
    { label: "Достижения", value: d.achievementsRu },
  ];
  return details.filter((item): item is { label: string; value: string } => Boolean(item.value?.trim()));
}

export function DoctorList({ doctors }: { doctors: ProfileDoctor[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? doctors : doctors.slice(0, DOCTORS_PREVIEW);
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map((d) => (
          <li key={d.id} className="clinic-panel flex gap-4 p-5">
            <span className="clinic-avatar h-14 w-14 rounded-2xl text-base">
              {d.photoUrl ? <img src={d.photoUrl} alt="" loading="lazy" /> : initials(d.nameRu || d.nameEn)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-ink">{d.nameRu || d.nameEn}</p>
              {(d.roleRu || d.roleEn) && <p className="mt-1 text-sm leading-snug text-muted">{d.roleRu || d.roleEn}</p>}
              {d.category || (d.experienceYears != null && d.experienceYears !== "") ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {d.experienceYears != null && d.experienceYears !== "" ? (
                    <span className="clinic-tag is-accent">опыт {d.experienceYears} лет</span>
                  ) : null}
                  {d.category ? <span className="clinic-tag">{CATEGORY_LABELS[d.category] || `категория: ${d.category}`}</span> : null}
                </div>
              ) : null}
              {(d.bioRu || d.bioEn) && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{d.bioRu || d.bioEn}</p>
              )}
              {doctorDetails(d).map(({ label, value }) => (
                <div key={label} className="mt-3 border-t border-line pt-3 text-sm">
                  <p className="clinic-label">{label}</p>
                  <p className="mt-1 leading-relaxed text-muted">{value}</p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {doctors.length > DOCTORS_PREVIEW ? (
        <button type="button" className="btn btn-ghost w-full text-sm" onClick={() => setAll((v) => !v)}>
          {all ? "Свернуть" : `Показать всех специалистов · ${doctors.length}`}
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
  children?: React.ReactNode;
};

/** The dark contacts card: every way to reach the clinic, each one a link. */
export function ContactCard({
  logoUrl,
  name,
  label = "Контакты",
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
  const covered = new Set(
    [whatsapp && "whatsapp", telegram && "telegram", instagram && "instagram", youtube && "youtube"].filter(Boolean),
  );
  const extra = socials.filter((s) => s.label?.trim() && s.url?.trim() && !covered.has(s.label.trim().toLowerCase()));
  return (
    <div className="clinic-contact">
      <div className="flex items-center gap-3 border-b border-white/10 p-6">
        <ClinicLogo src={logoUrl} name={name} className="h-12 w-12 rounded-2xl" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-white/60">{label}</p>
          <p className="truncate font-semibold">{name}</p>
        </div>
      </div>
      <div className="px-6 py-2">
        {phones.map((phone, index) => (
          <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="clinic-contact-row">
            <Icon name="phone" />
            <span className={index === 0 ? "text-base font-semibold text-white" : undefined}>{phone}</span>
          </a>
        ))}
        {email ? (
          <a href={`mailto:${email}`} className="clinic-contact-row">
            <Icon name="mail" />
            <span>{email}</span>
          </a>
        ) : null}
        {website ? (
          <a href={/^https?:\/\//i.test(website) ? website : `https://${website}`} target="_blank" rel="noreferrer" className="clinic-contact-row">
            <Icon name="globe" />
            <span>{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          </a>
        ) : null}
        {whatsapp ? (
          <a href={socialHref("whatsapp", whatsapp)} target="_blank" rel="noreferrer" className="clinic-contact-row">
            <Icon name="chat" />
            <span>WhatsApp · {socialLabel(whatsapp)}</span>
          </a>
        ) : null}
        {telegram ? (
          <a href={socialHref("telegram", telegram)} target="_blank" rel="noreferrer" className="clinic-contact-row">
            <Icon name="send" />
            <span>Telegram · {socialLabel(telegram)}</span>
          </a>
        ) : null}
        {instagram ? (
          <a href={socialHref("instagram", instagram)} target="_blank" rel="noreferrer" className="clinic-contact-row">
            <Icon name="camera" />
            <span>Instagram · {socialLabel(instagram).replace(/^@?/, "@")}</span>
          </a>
        ) : null}
        {youtube ? (
          <a href={youtube} target="_blank" rel="noreferrer" className="clinic-contact-row">
            <Icon name="play" />
            <span>YouTube</span>
          </a>
        ) : null}
        {extra.map((social) => (
          <a key={social.url} href={social.url} target="_blank" rel="noreferrer" className="clinic-contact-row">
            <Icon name="link" />
            <span>{social.label}</span>
          </a>
        ))}
        {responseHours ? (
          <p className="clinic-contact-row">
            <Icon name="clock" />
            <span>Отвечают примерно за {responseHours} ч</span>
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
