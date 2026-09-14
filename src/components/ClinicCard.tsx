import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { cityLabel, formatPrice, languageLabel, localized, parseLanguages } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type ClinicCardClinic = {
  slug: string;
  nameEn: string;
  nameRu: string;
  city: string;
  descriptionEn: string;
  descriptionRu: string;
  languages: string;
  logoUrl: string | null;
  coverColor: string;
  responseHours?: number;
  photos: { url: string }[];
  specialties: { specialty: { nameEn: string; nameRu: string } }[];
  fromPrice?: number | null;
};

export async function ClinicCard({
  clinic,
  compact = false,
  matchReason,
}: {
  clinic: ClinicCardClinic;
  compact?: boolean;
  matchReason?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("catalog");
  const tClinic = await getTranslations("clinic");
  const name = localized(clinic, locale, "name");
  const description = localized(clinic, locale, "description");
  const photo = clinic.photos[0]?.url || clinic.logoUrl;
  const languages = parseLanguages(clinic.languages);

  return (
    <article className="card-shadow overflow-hidden rounded-3xl border border-line bg-white">
      <div className="relative h-44 bg-teal" style={{ backgroundColor: clinic.coverColor }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover opacity-90" />
        ) : null}
        {clinic.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinic.logoUrl}
            alt=""
            className="absolute left-4 top-4 h-12 w-12 rounded-2xl border border-white/40 bg-white/10"
          />
        ) : null}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="font-display text-2xl leading-tight">{name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <MapPin size={14} />
            {cityLabel(clinic.city, locale)}
          </p>
        </div>
        {matchReason ? <p className="text-sm text-teal-deep">{matchReason}</p> : null}
        {!compact ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {clinic.specialties.slice(0, 4).map((item) => (
            <span key={localized(item.specialty, locale, "name")} className="chip">
              {localized(item.specialty, locale, "name")}
            </span>
          ))}
        </div>
        <p className="text-xs font-semibold text-ink">
          {t("languages")}:{" "}
          {languages.map((code) => languageLabel(code, locale)).join(" · ")}
        </p>
        <p className="text-xs text-muted">
          {clinic.fromPrice != null ? `${t("fromPrice")} ${formatPrice(clinic.fromPrice, locale)} · ` : ""}
          {t("replyIn", { hours: clinic.responseHours ?? 24 })}
        </p>
        <div className="flex gap-2 pt-1">
          <Link href={`/clinics/${clinic.slug}`} className="btn btn-ghost flex-1 text-sm">
            {tClinic("open")}
          </Link>
          <Link href={`/clinics/${clinic.slug}/apply`} className="btn btn-primary flex-1 text-sm">
            {tClinic("apply")}
          </Link>
        </div>
      </div>
    </article>
  );
}
