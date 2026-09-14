import { getTranslations, setRequestLocale } from "next-intl/server";
import { go } from "@/lib/redirect";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { getCheckerState } from "@/lib/checker-state";
import { ClinicCard } from "@/components/ClinicCard";
import { localized } from "@/lib/format";
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

  const clinics = await prisma.clinic.findMany({
    where: {
      published: true,
      specialties: { some: { specialtyId: specialty.id } },
    },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
    },
    take: 6,
  });

  const loc = locale as Locale;
  const specialtyName = localized(specialty, loc, "name");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">
        {t("kicker")}
      </p>
      <h1 className="mt-3 max-w-4xl font-display text-4xl md:text-6xl">
        {specialtyName}
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-muted">
        {t("title", { specialty: specialtyName })}
      </p>
      <section className="mt-8 max-w-3xl rounded-3xl border border-line bg-white p-6">
        <h2 className="font-display text-2xl">{t("why")}</h2>
        <p className="mt-3 leading-relaxed text-muted">
          {localized(specialty, loc, "explanation")}
        </p>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl">{t("clinics")}</h2>
          <Link
            href={`/clinics?specialty=${specialty.slug}`}
            className="text-sm font-semibold text-teal"
          >
            {t("allClinics")}
          </Link>
        </div>
        {clinics.length === 0 ? (
          <p className="mt-6 text-muted">
            {t("empty")}{" "}
            <Link href="/clinics" className="font-semibold text-teal">
              {t("browse")}
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {clinics.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
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
