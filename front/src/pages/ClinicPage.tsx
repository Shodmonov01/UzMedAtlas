import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { api } from "../api";
import { ClinicCard, type ClinicCardClinic } from "../components/ClinicCard";
import { ClinicCover } from "../components/ClinicCover";
import { CopyLinkButton } from "../components/CopyLinkButton";
import { JsonLd } from "../components/JsonLd";
import { RecordClinicView, RecentlyViewed } from "../components/RecentlyViewed";
import { StickyApplyBar } from "../components/StickyApplyBar";
import { LocaleLink, useLocale, withLocale } from "../locale-link";
import { cityLabel, formatPrice, languageLabel, localized, parseLanguages } from "@/lib/format";
import { clinicJsonLd } from "@/lib/jsonld";
import { telegramLink, whatsappLink } from "@/lib/phone";

type ClinicDetail = {
  id: string;
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
  addressEn: string;
  addressRu: string;
  phone: string;
  email: string;
  website: string | null;
  whatsapp: string | null;
  telegram: string | null;
  coordinatorRoleEn: string | null;
  coordinatorRoleRu: string | null;
  licenseInfoEn: string | null;
  licenseInfoRu: string | null;
  afterRequestEn: string | null;
  afterRequestRu: string | null;
  photos: { id: string; url: string; altEn: string; altRu: string }[];
  specialties: { specialtyId: string; specialty: { slug: string; nameEn: string; nameRu: string } }[];
  services: {
    id: string;
    specialtyId: string;
    nameEn: string;
    nameRu: string;
    descriptionEn: string;
    descriptionRu: string;
    priceUsd: number | null;
    specialty: { nameEn: string; nameRu: string };
  }[];
};

export function ClinicPage() {
  const { slug } = useParams();
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<ClinicDetail | null>(null);
  const [related, setRelated] = useState<ClinicCardClinic[]>([]);

  useEffect(() => {
    if (!slug) return;
    api
      .get<{ clinic: ClinicDetail; related: ClinicCardClinic[] }>(`/api/clinics/${slug}`)
      .then((data) => {
        setClinic(data.clinic);
        setRelated(data.related);
      })
      .catch(() => navigate(withLocale(locale, "/clinics"), { replace: true }));
  }, [slug, locale, navigate]);

  if (!clinic) return null;
  const languages = parseLanguages(clinic.languages);
  const grouped = new Map<string, typeof clinic.services>();
  for (const service of clinic.services) {
    grouped.set(service.specialtyId, [...(grouped.get(service.specialtyId) ?? []), service]);
  }
  const name = localized(clinic, locale, "name");
  const wa = clinic.whatsapp || clinic.phone;
  const waHref = wa ? whatsappLink(wa) : null;
  const tgHref = clinic.telegram ? telegramLink(clinic.telegram) : null;

  return (
    <div className="portal mx-auto max-w-7xl px-4 py-10">
      <JsonLd data={clinicJsonLd(clinic, locale)} />
      <RecordClinicView slug={clinic.slug} name={name} />
      <LocaleLink to="/clinics" className="text-sm font-semibold text-muted">
        ← {t("clinic.back")}
      </LocaleLink>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="overflow-hidden rounded-[2rem] border border-line">
            <ClinicCover
              src={clinic.photos[0]?.url || clinic.logoUrl}
              alt={name}
              color={clinic.coverColor}
              className="h-72 w-full object-cover"
            />
          </div>
          {clinic.photos.length > 1 ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {clinic.photos.slice(1).map((photo) => (
                <ClinicCover
                  key={photo.id}
                  src={photo.url}
                  alt={locale === "ru" ? photo.altRu : photo.altEn}
                  color={clinic.coverColor}
                  className="h-28 w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : null}
          <h1 className="mt-8 font-display text-5xl">{name}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted">
            <MapPin size={16} />
            {cityLabel(clinic.city, locale)} · {localized(clinic, locale, "address")}
          </p>
          <section className="mt-8">
            <h2 className="font-display text-3xl">{t("clinic.about")}</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">{localized(clinic, locale, "description")}</p>
          </section>
          <section className="mt-8">
            <h2 className="font-display text-3xl">{t("clinic.specialties")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {clinic.specialties.map((item) => (
                <LocaleLink key={item.specialtyId} to={`/clinics?specialty=${item.specialty.slug}`} className="chip">
                  {localized(item.specialty, locale, "name")}
                </LocaleLink>
              ))}
            </div>
          </section>
          <section className="mt-8">
            <h2 className="font-display text-3xl">{t("clinic.services")}</h2>
            <div className="mt-4 space-y-6">
              {[...grouped.entries()].map(([specialtyId, services]) => {
                const specialty = services[0]?.specialty;
                return (
                  <div key={specialtyId} className="rounded-3xl border border-line bg-white p-5">
                    <h3 className="font-display text-2xl">{specialty ? localized(specialty, locale, "name") : ""}</h3>
                    <ul className="mt-3 space-y-3">
                      {services.map((service) => (
                        <li key={service.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{localized(service, locale, "name")}</p>
                              <p className="text-sm text-muted">{localized(service, locale, "description")}</p>
                            </div>
                            <p className="shrink-0 text-sm font-bold text-teal">{formatPrice(service.priceUsd, locale)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
          {related.length ? (
            <section className="mt-10">
              <h2 className="font-display text-3xl">{t("clinic.related")}</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {related.map((item) => (
                  <ClinicCard key={item.slug} clinic={item} compact />
                ))}
              </div>
            </section>
          ) : null}
          <RecentlyViewed currentSlug={clinic.slug} />
        </div>
        <aside className="h-fit rounded-[2rem] bg-teal-deep p-6 text-white lg:sticky lg:top-24">
          {clinic.logoUrl ? (
            <ClinicCover src={clinic.logoUrl} alt="" color={clinic.coverColor} className="mb-4 h-16 w-16 rounded-2xl" />
          ) : null}
          <h2 className="text-2xl font-extrabold">{t("clinic.contacts")}</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/85">
            <li className="flex gap-2">
              <Phone size={16} /> {clinic.phone}
            </li>
            <li className="flex gap-2">
              <Mail size={16} /> {clinic.email}
            </li>
            {clinic.website ? (
              <li className="flex gap-2">
                <Globe size={16} />
                <a className="underline" href={clinic.website}>
                  {clinic.website.replace(/^https?:\/\//, "")}
                </a>
              </li>
            ) : null}
          </ul>
          <h3 className="mt-6 font-bold">{t("clinic.languages")}</h3>
          <p className="mt-1 text-sm font-medium text-white/85">
            {languages.map((code) => languageLabel(code, locale)).join(" · ")}
          </p>
          {clinic.coordinatorName ? (
            <>
              <h3 className="mt-6 font-bold">{t("clinic.coordinator")}</h3>
              <p className="mt-1 text-sm text-white/75">
                {clinic.coordinatorName}
                {(locale === "ru" ? clinic.coordinatorRoleRu : clinic.coordinatorRoleEn)
                  ? ` · ${locale === "ru" ? clinic.coordinatorRoleRu : clinic.coordinatorRoleEn}`
                  : ""}
              </p>
            </>
          ) : null}
          <p className="mt-3 text-sm text-white/75">
            {locale === "ru"
              ? `Обычно отвечают за ${clinic.responseHours} ч.`
              : `Usually replies within ${clinic.responseHours} hours.`}
          </p>
          {(locale === "ru" ? clinic.licenseInfoRu : clinic.licenseInfoEn) ? (
            <>
              <h3 className="mt-6 font-bold">{t("clinic.license")}</h3>
              <p className="mt-1 text-sm text-white/75">
                {locale === "ru" ? clinic.licenseInfoRu : clinic.licenseInfoEn}
              </p>
            </>
          ) : null}
          {(locale === "ru" ? clinic.afterRequestRu : clinic.afterRequestEn) ? (
            <>
              <h3 className="mt-6 font-bold">{t("clinic.afterRequest")}</h3>
              <p className="mt-1 text-sm text-white/75">
                {locale === "ru" ? clinic.afterRequestRu : clinic.afterRequestEn}
              </p>
            </>
          ) : null}
          {waHref ? (
            <a className="mt-4 block text-sm font-bold text-lime" href={waHref}>
              {t("clinic.whatsapp")}
            </a>
          ) : null}
          {tgHref ? (
            <a className="mt-2 block text-sm font-bold text-lime" href={tgHref}>
              {t("clinic.telegram")}
            </a>
          ) : null}
          <div className="mt-4 text-lime">
            <CopyLinkButton />
          </div>
          <LocaleLink to={`/clinics/${clinic.slug}/apply`} className="btn btn-primary mt-6 w-full">
            {t("clinic.apply")}
          </LocaleLink>
          <LocaleLink to={`/clinics/${clinic.slug}/apply`} className="btn mt-3 w-full bg-white text-teal-deep">
            {t("clinic.consult")}
          </LocaleLink>
        </aside>
      </div>
      <StickyApplyBar slug={clinic.slug} clinicName={name} />
    </div>
  );
}
