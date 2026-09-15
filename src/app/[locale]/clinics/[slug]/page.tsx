import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import {
  cityLabel,
  formatPrice,
  languageLabel,
  localized,
  parseLanguages,
} from "@/lib/format";
import { clinicJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";
import { telegramLink, whatsappLink } from "@/lib/phone";
import { ClinicCard } from "@/components/ClinicCard";
import { ClinicCover } from "@/components/ClinicCover";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { JsonLd } from "@/components/JsonLd";
import { RecordClinicView, RecentlyViewed } from "@/components/RecentlyViewed";
import { StickyApplyBar } from "@/components/StickyApplyBar";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const clinic = await prisma.clinic.findUnique({ where: { slug } });
  if (!clinic || !clinic.published) return { title: "Clinic" };
  const name = locale === "ru" ? clinic.nameRu : clinic.nameEn;
  const description = (locale === "ru" ? clinic.descriptionRu : clinic.descriptionEn).slice(0, 160);
  const url = `${siteUrl()}/${locale}/clinics/${slug}`;
  return {
    title: name,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteUrl()}/en/clinics/${slug}`,
        ru: `${siteUrl()}/ru/clinics/${slug}`,
      },
    },
    openGraph: { title: name, description, url, locale: locale === "ru" ? "ru_RU" : "en_US" },
  };
}

export default async function ClinicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations("clinic");
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
      services: { include: { specialty: true }, orderBy: { nameEn: "asc" } },
    },
  });
  if (!clinic || !clinic.published) notFound();
  await trackEvent("clinic_view", { clinic: clinic.slug });

  const languages = parseLanguages(clinic.languages);
  const grouped = new Map<string, typeof clinic.services>();
  for (const service of clinic.services) {
    const key = service.specialtyId;
    grouped.set(key, [...(grouped.get(key) ?? []), service]);
  }

  const specialtyIds = clinic.specialties.map((item) => item.specialtyId);
  const relatedRaw = await prisma.clinic.findMany({
    where: {
      published: true,
      id: { not: clinic.id },
      OR: [
        { city: clinic.city },
        ...(specialtyIds.length
          ? [{ specialties: { some: { specialtyId: { in: specialtyIds } } } }]
          : []),
      ],
    },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
      services: true,
    },
    take: 8,
  });
  const related = relatedRaw
    .map((item) => ({
      ...item,
      overlap: item.specialties.filter((rel) => specialtyIds.includes(rel.specialtyId)).length,
      fromPrice:
        item.services
          .map((service) => service.priceUsd)
          .filter((value): value is number => value != null)
          .sort((a, b) => a - b)[0] ?? null,
    }))
    .sort((a, b) => b.overlap - a.overlap || a.responseHours - b.responseHours)
    .slice(0, 3);

  const name = localized(clinic, loc, "name");
  const wa = clinic.whatsapp || clinic.phone;
  const waHref = wa ? whatsappLink(wa) : null;
  const tgHref = clinic.telegram ? telegramLink(clinic.telegram) : null;

  return (
    <div className="portal mx-auto max-w-7xl px-4 py-10">
      <JsonLd data={clinicJsonLd(clinic, loc)} />
      <RecordClinicView slug={clinic.slug} name={name} />
      <Link href="/clinics" className="text-sm font-semibold text-muted">
        ← {t("back")}
      </Link>
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
                  alt={loc === "ru" ? photo.altRu : photo.altEn}
                  color={clinic.coverColor}
                  className="h-28 w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : null}

          <h1 className="mt-8 font-display text-5xl">{name}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted">
            <MapPin size={16} />
            {cityLabel(clinic.city, loc)} · {localized(clinic, loc, "address")}
          </p>
          <section className="mt-8">
            <h2 className="font-display text-3xl">{t("about")}</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">
              {localized(clinic, loc, "description")}
            </p>
          </section>
          <section className="mt-8">
            <h2 className="font-display text-3xl">{t("specialties")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {clinic.specialties.map((item) => (
                <Link
                  key={item.specialtyId}
                  href={`/clinics?specialty=${item.specialty.slug}`}
                  className="chip"
                >
                  {localized(item.specialty, loc, "name")}
                </Link>
              ))}
            </div>
          </section>
          <section className="mt-8">
            <h2 className="font-display text-3xl">{t("services")}</h2>
            <div className="mt-4 space-y-6">
              {[...grouped.entries()].map(([specialtyId, services]) => {
                const specialty = services[0]?.specialty;
                return (
                  <div key={specialtyId} className="rounded-3xl border border-line bg-white p-5">
                    <h3 className="font-display text-2xl">
                      {specialty ? localized(specialty, loc, "name") : ""}
                    </h3>
                    <ul className="mt-3 space-y-3">
                      {services.map((service) => (
                        <li key={service.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{localized(service, loc, "name")}</p>
                              <p className="text-sm text-muted">
                                {localized(service, loc, "description")}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-bold text-teal">
                              {formatPrice(service.priceUsd, loc)}
                            </p>
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
              <h2 className="font-display text-3xl">{t("related")}</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {related.map((item) => (
                  <ClinicCard key={item.id} clinic={item} compact />
                ))}
              </div>
            </section>
          ) : null}
          <RecentlyViewed currentSlug={clinic.slug} />
        </div>
        <aside className="h-fit rounded-[2rem] bg-teal-deep p-6 text-white lg:sticky lg:top-24">
          {clinic.logoUrl ? (
            <ClinicCover
              src={clinic.logoUrl}
              alt=""
              color={clinic.coverColor}
              className="mb-4 h-16 w-16 rounded-2xl"
            />
          ) : null}
          <h2 className="text-2xl font-extrabold">{t("contacts")}</h2>
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
          <h3 className="mt-6 font-bold">{t("languages")}</h3>
          <p className="mt-1 text-sm font-medium text-white/85">
            {languages.map((code) => languageLabel(code, loc)).join(" · ")}
          </p>
          {clinic.coordinatorName ? (
            <>
              <h3 className="mt-6 font-bold">{t("coordinator")}</h3>
              <p className="mt-1 text-sm text-white/75">
                {clinic.coordinatorName}
                {(loc === "ru" ? clinic.coordinatorRoleRu : clinic.coordinatorRoleEn)
                  ? ` · ${loc === "ru" ? clinic.coordinatorRoleRu : clinic.coordinatorRoleEn}`
                  : ""}
              </p>
            </>
          ) : null}
          <p className="mt-3 text-sm text-white/75">
            {loc === "ru"
              ? `Обычно отвечают за ${clinic.responseHours} ч.`
              : `Usually replies within ${clinic.responseHours} hours.`}
          </p>
          {(loc === "ru" ? clinic.licenseInfoRu : clinic.licenseInfoEn) ? (
            <>
              <h3 className="mt-6 font-bold">{t("license")}</h3>
              <p className="mt-1 text-sm text-white/75">
                {loc === "ru" ? clinic.licenseInfoRu : clinic.licenseInfoEn}
              </p>
            </>
          ) : null}
          {(loc === "ru" ? clinic.afterRequestRu : clinic.afterRequestEn) ? (
            <>
              <h3 className="mt-6 font-bold">{t("afterRequest")}</h3>
              <p className="mt-1 text-sm text-white/75">
                {loc === "ru" ? clinic.afterRequestRu : clinic.afterRequestEn}
              </p>
            </>
          ) : null}
          {waHref ? (
            <a className="mt-4 block text-sm font-bold text-lime" href={waHref}>
              {t("whatsapp")}
            </a>
          ) : null}
          {tgHref ? (
            <a className="mt-2 block text-sm font-bold text-lime" href={tgHref}>
              {t("telegram")}
            </a>
          ) : null}
          <div className="mt-4 text-lime">
            <CopyLinkButton />
          </div>
          <Link href={`/clinics/${clinic.slug}/apply`} className="btn btn-primary mt-6 w-full">
            {t("apply")}
          </Link>
          <Link href={`/clinics/${clinic.slug}/apply`} className="btn mt-3 w-full bg-white text-teal-deep">
            {t("consult")}
          </Link>
        </aside>
      </div>
      <StickyApplyBar slug={clinic.slug} clinicName={name} />
    </div>
  );
}
