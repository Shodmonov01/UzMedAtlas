import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { saveLeadDetails } from "@/actions/admin";

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
    include: { clinic: true, recommendedSpecialty: true, emails: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) notFound();

  const events = lead.sessionId
    ? await prisma.analyticsEvent.findMany({
        where: { sessionId: lead.sessionId },
        orderBy: { createdAt: "asc" },
        take: 40,
      })
    : [];

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
  const hoursLabel =
    lead.preferredHours === "morning"
      ? tApply("morning")
      : lead.preferredHours === "afternoon"
        ? tApply("afternoon")
        : lead.preferredHours === "evening"
          ? tApply("evening")
          : lead.preferredHours
            ? tApply("anytime")
            : "—";

  const rows = [
    [t("patient"), lead.fullName],
    [t("country"), lead.country],
    [t("clinic"), locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn],
    [t("contact"), `${lead.phone} · ${contactLabel}`],
    ["Email", lead.email || "—"],
    [t("date"), lead.createdAt.toISOString().slice(0, 16).replace("T", " ")],
    [tApply("arrival"), `${arrivalLabel}${lead.arrivalDate ? ` · ${lead.arrivalDate}` : ""}`],
    [tApply("preferredHours"), hoursLabel],
    [t("direction"), lead.recommendedSpecialty ? (locale === "ru" ? lead.recommendedSpecialty.nameRu : lead.recommendedSpecialty.nameEn) : "—"],
    [tChecker("symptomsLabel"), lead.symptoms || lead.medicalNeed || "—"],
    [tChecker("age"), lead.age?.toString() || "—"],
    [tChecker("gender"), genderLabel],
    [tChecker("duration"), durationLabel],
    [t("source"), lead.source === "checker" ? t("sourceChecker") : t("sourceCatalog")],
    [t("status"), lead.status],
    [tChecker("forChild"), lead.forChild ? "yes" : "no"],
    ["UTM", [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ") || "—"],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="text-sm font-semibold text-muted">
        ← {t("leads")}
      </Link>
      <h1 className="font-display text-4xl">{lead.fullName}</h1>
      <form action={saveLeadDetails} className="space-y-4">
        <input type="hidden" name="id" value={lead.id} />
        <input type="hidden" name="locale" value={locale} />
        <div className="flex flex-wrap items-center gap-3">
          <select name="status" defaultValue={lead.status} className="field w-auto">
            <option value="new">{t("statusNew")}</option>
            <option value="contacted">{t("statusContacted")}</option>
            <option value="closed">{t("statusClosed")}</option>
          </select>
        </div>
        <dl className="grid gap-4 rounded-3xl border border-line bg-white p-6 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>
        <label className="block rounded-3xl border border-line bg-white p-6 text-sm font-semibold">
          {t("notes")}
          <textarea name="notes" rows={4} defaultValue={lead.notes || ""} className="field mt-1 font-normal" />
        </label>
        <button className="btn btn-primary" type="submit">
          {t("save")}
        </button>
      </form>
      {lead.emails.length ? (
        <section>
          <h2 className="font-display text-2xl">{t("outbox")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lead.emails.map((email) => (
              <li key={email.id} className="rounded-2xl border border-line bg-white p-4">
                <p className="font-semibold">{email.toAddress}</p>
                <p className="text-muted">{email.subject} · {email.status}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {events.length ? (
        <section>
          <h2 className="font-display text-2xl">{t("sessionEvents")}</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {events.map((event) => (
              <li key={event.id} className="rounded-2xl border border-line bg-white px-4 py-3">
                <span className="font-semibold">{event.type}</span>
                <span className="ml-2 text-muted">
                  {event.createdAt.toISOString().slice(11, 16)}
                  {event.meta ? ` · ${event.meta}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
