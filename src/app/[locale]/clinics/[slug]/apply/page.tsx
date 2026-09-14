import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCheckerState, hasCheckerDetails } from "@/lib/checker-state";
import { LeadForm } from "@/components/LeadForm";
import { localized } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations("apply");
  const tChecker = await getTranslations("checker");
  const clinic = await prisma.clinic.findUnique({ where: { slug } });
  if (!clinic || !clinic.published) notFound();
  await trackEvent("apply_start", { clinic: clinic.slug });

  const checker = await getCheckerState();
  const usedChecker = hasCheckerDetails(checker);
  const specialty = checker?.specialtySlug
    ? await prisma.specialty.findUnique({ where: { slug: checker.specialtySlug } })
    : null;

  const summary = usedChecker
    ? [
        checker?.symptoms,
        checker?.age ? `${tChecker("age")}: ${checker.age}` : null,
        checker?.gender
          ? `${tChecker("gender")}: ${
              checker.gender === "female"
                ? tChecker("female")
                : checker.gender === "male"
                  ? tChecker("male")
                  : tChecker("preferNot")
            }`
          : null,
        checker?.duration
          ? `${tChecker("duration")}: ${
              checker.duration === "few_days"
                ? tChecker("fewDays")
                : checker.duration === "few_weeks"
                  ? tChecker("fewWeeks")
                  : checker.duration === "few_months"
                    ? tChecker("fewMonths")
                    : tChecker("moreThanYear")
            }`
          : null,
        specialty ? localized(specialty, loc, "name") : null,
      ].filter(Boolean) as string[]
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl md:text-5xl">
        {t("title", { clinic: localized(clinic, loc, "name") })}
      </h1>
      <p className="mt-3 text-muted">{t("subtitle")}</p>
      <div className="mt-8">
        <LeadForm
          locale={locale}
          clinicSlug={clinic.slug}
          usedChecker={usedChecker}
          checkerSummary={summary}
          afterRequest={(loc === "ru" ? clinic.afterRequestRu : clinic.afterRequestEn) || undefined}
        />
      </div>
    </div>
  );
}
