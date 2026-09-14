import { getTranslations, setRequestLocale } from "next-intl/server";
import { go } from "@/lib/redirect";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { getCheckerState } from "@/lib/checker-state";
import { ClinicCard } from "@/components/ClinicCard";
import { cityLabel, formatPrice, languageLabel, localized, parseLanguages } from "@/lib/format";
import { chooseSpecialty } from "@/actions/public";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("results");
  const tCatalog = await getTranslations("catalog");
  const state = await getCheckerState();
  if (!state?.specialtySlug || !state.symptoms) {
    go("/", locale);
  }

  const specialty = await prisma.specialty.findUnique({
    where: { slug: state.specialtySlug },
  });
  if (!specialty) {
    go("/clinics", locale);
  }

  const alternatives = await prisma.specialty.findMany({
    where: { slug: { in: (state.specialtySlugs ?? []).filter((slug) => slug !== specialty.slug) } },
    orderBy: { sortOrder: "asc" },
  });

  const clinics = await prisma.clinic.findMany({
    where: {
      published: true,
      specialties: { some: { specialtyId: specialty.id } },
    },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
      services: true,
    },
  });

  const loc = locale as Locale;
  const specialtyName = localized(specialty, loc, "name");
  const ranked = clinics
    .map((clinic) => ({
      ...clinic,
      fromPrice:
        clinic.services
          .map((item) => item.priceUsd)
          .filter((value): value is number => value != null)
          .sort((a, b) => a - b)[0] ?? null,
    }))
    .sort((a, b) => a.responseHours - b.responseHours);

  const redFlagCopy: Record<string, string> = {
    chest: t("redFlagChest"),
    stroke: t("redFlagStroke"),
    bleeding: t("redFlagBleeding"),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">
        {t("kicker")}
      </p>
      <h1 className="mt-3 max-w-4xl font-display text-4xl md:text-6xl">{specialtyName}</h1>
      <p className="mt-4 max-w-3xl text-lg text-muted">
        {t("title", { specialty: specialtyName })}
      </p>

      {state.redFlags?.length ? (
        <div className="mt-6 max-w-3xl rounded-3xl border border-clay/40 bg-orange-50 p-5">
          <h2 className="font-display text-2xl">{t("redFlagTitle")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {state.redFlags.map((flag) => (
              <li key={flag}>{redFlagCopy[flag]}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="mt-8 max-w-3xl rounded-3xl border border-line bg-white p-6">
        <h2 className="font-display text-2xl">{t("why")}</h2>
        <p className="mt-3 leading-relaxed text-muted">{localized(specialty, loc, "explanation")}</p>
        <p className="mt-4 text-sm text-muted">{t("disclaimerBox")}</p>
      </section>

      {alternatives.length > 0 ? (
        <section className="mt-8 max-w-3xl">
          <h2 className="font-display text-2xl">{t("also")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {alternatives.map((item) => (
              <form action={chooseSpecialty} key={item.id}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="specialtySlug" value={item.slug} />
                <button className="chip" type="submit">
                  {localized(item, loc, "name")} · {t("notThis")}
                </button>
              </form>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl">{t("clinics")}</h2>
          <Link href={`/clinics?specialty=${specialty.slug}`} className="text-sm font-semibold text-teal">
            {t("allClinics")}
          </Link>
        </div>
        {ranked.length === 0 ? (
          <p className="mt-6 text-muted">
            {t("empty")}{" "}
            <Link href="/clinics" className="font-semibold text-teal">
              {t("browse")}
            </Link>
          </p>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-sand">
                  <tr>
                    <th className="px-4 py-3">{t("clinics")}</th>
                    <th className="px-4 py-3">{tCatalog("city")}</th>
                    <th className="px-4 py-3">{t("fromPrice")}</th>
                    <th className="px-4 py-3">{t("response")}</th>
                    <th className="px-4 py-3">{tCatalog("languages")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((clinic) => (
                    <tr key={clinic.id} className="border-t border-line">
                      <td className="px-4 py-3 font-semibold">{localized(clinic, loc, "name")}</td>
                      <td className="px-4 py-3">{cityLabel(clinic.city, loc)}</td>
                      <td className="px-4 py-3">{formatPrice(clinic.fromPrice, loc)}</td>
                      <td className="px-4 py-3">{t("hours", { hours: clinic.responseHours })}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted">
                          {parseLanguages(clinic.languages)
                            .map((code) => languageLabel(code, loc))
                            .join(", ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {ranked.slice(0, 6).map((clinic) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  matchReason={t("whyClinic", { specialty: specialtyName })}
                />
              ))}
            </div>
          </>
        )}
      </section>
      <p className="mt-10">
        <Link href="/" className="text-sm font-semibold text-muted">
          {t("change")}
        </Link>
      </p>
    </div>
  );
}
