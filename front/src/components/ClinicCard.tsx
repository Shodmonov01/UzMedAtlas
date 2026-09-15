import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { ClinicCover } from "./ClinicCover";
import { Avatar } from "./Avatar";
import { LocaleLink, useLocale } from "../locale-link";
import { cityLabel, formatPrice, languageLabel, localized, parseLanguages } from "@/lib/format";

export type ClinicCardClinic = {
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
  coordinatorName?: string | null;
  photos: { url: string }[];
  specialties: { specialty: { nameEn: string; nameRu: string } }[];
  fromPrice?: number | null;
};

export function ClinicCard({
  clinic,
  compact = false,
  matchReason,
}: {
  clinic: ClinicCardClinic;
  compact?: boolean;
  matchReason?: string;
}) {
  const locale = useLocale();
  const { t } = useTranslation();
  const name = localized(clinic, locale, "name");
  const description = localized(clinic, locale, "description");
  const photo = clinic.photos[0]?.url || clinic.logoUrl;
  const languages = parseLanguages(clinic.languages);

  return (
    <article className="soft-card overflow-hidden rounded-[2rem] bg-white">
      <div className="relative h-48" style={{ backgroundColor: clinic.coverColor || "#173832" }}>
        <ClinicCover src={photo} alt="" color={clinic.coverColor} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <span className="chip absolute right-3 top-3 bg-white/90">
          {t("catalog.replyIn", { hours: clinic.responseHours ?? 24 })}
        </span>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-xl font-extrabold leading-tight">{name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
            <MapPin size={14} />
            {cityLabel(clinic.city, locale)}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-5">
        {clinic.coordinatorName ? (
          <div className="flex items-center gap-3">
            <Avatar name={clinic.coordinatorName} size="sm" />
            <p className="text-sm font-bold">{clinic.coordinatorName}</p>
          </div>
        ) : null}
        {matchReason ? <p className="text-sm font-semibold text-teal-deep">{matchReason}</p> : null}
        {!compact ? <p className="line-clamp-3 text-sm leading-relaxed text-muted">{description}</p> : null}
        <div className="flex flex-wrap gap-2">
          {clinic.specialties.slice(0, 3).map((item) => (
            <span key={localized(item.specialty, locale, "name")} className="chip bg-mint">
              {localized(item.specialty, locale, "name")}
            </span>
          ))}
        </div>
        <p className="text-xs font-semibold text-muted">
          {languages.map((code) => languageLabel(code, locale)).join(" · ")}
          {clinic.fromPrice != null ? ` · ${t("catalog.fromPrice")} ${formatPrice(clinic.fromPrice, locale)}` : ""}
        </p>
        <div className="flex gap-2 pt-1">
          <LocaleLink to={`/clinics/${clinic.slug}`} className="btn btn-ghost flex-1 text-sm">
            {t("clinic.open")}
          </LocaleLink>
          <LocaleLink to={`/clinics/${clinic.slug}/apply`} className="btn btn-primary flex-1 text-sm">
            {t("clinic.apply")}
          </LocaleLink>
        </div>
      </div>
    </article>
  );
}
