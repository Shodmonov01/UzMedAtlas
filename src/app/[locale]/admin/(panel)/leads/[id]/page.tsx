import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const tChecker = await getTranslations("checker");
  const tApply = await getTranslations("apply");
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { clinic: true, recommendedSpecialty: true },
  });
  if (!lead) notFound();

  const genderLabel =
    lead.gender === "female"
      ? tChecker("female")
      : lead.gender === "male"
        ? tChecker("male")
        : lead.gender === "prefer_not"
          ? tChecker("preferNot")
          : "—";
  const durationLabel =
    lead.duration === "few_days"
      ? tChecker("fewDays")
      : lead.duration === "few_weeks"
        ? tChecker("fewWeeks")
        : lead.duration === "few_months"
          ? tChecker("fewMonths")
          : lead.duration === "more_than_year"
            ? tChecker("moreThanYear")
            : "—";
  const contactLabel =
    lead.contactMethod === "phone"
      ? tApply("phoneMethod")
      : lead.contactMethod === "email"
        ? tApply("emailMethod")
        : lead.contactMethod === "telegram"
          ? tApply("telegram")
          : tApply("whatsapp");
  const arrivalLabel =
    lead.arrivalType === "exact"
      ? tApply("exact")
      : lead.arrivalType === "approximate"
        ? tApply("approximate")
        : tApply("undecided");

  const rows = [
    [t("patient"), lead.fullName],
    [t("country"), lead.country],
    [t("clinic"), locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn],
    [t("contact"), `${lead.phone} · ${contactLabel}`],
    ["Email", lead.email || "—"],
    [t("date"), lead.createdAt.toISOString().slice(0, 16).replace("T", " ")],
    [tApply("arrival"), `${arrivalLabel}${lead.arrivalDate ? ` · ${lead.arrivalDate}` : ""}`],
    [t("direction"), lead.recommendedSpecialty ? (locale === "ru" ? lead.recommendedSpecialty.nameRu : lead.recommendedSpecialty.nameEn) : "—"],
    [tChecker("symptomsLabel"), lead.symptoms || lead.medicalNeed || "—"],
    [tChecker("age"), lead.age?.toString() || "—"],
    [tChecker("gender"), genderLabel],
    [tChecker("duration"), durationLabel],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="text-sm font-semibold text-muted">
        ← {t("leads")}
      </Link>
      <h1 className="font-display text-4xl">{lead.fullName}</h1>
      <dl className="grid gap-4 rounded-3xl border border-line bg-white p-6 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
