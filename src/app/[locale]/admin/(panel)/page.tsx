import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const [clinics, leads, checkerLeads, catalogLeads, events] = await Promise.all([
    prisma.clinic.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { source: "checker" } }),
    prisma.lead.count({ where: { source: "catalog" } }),
    prisma.analyticsEvent.groupBy({
      by: ["type"],
      _count: { type: true },
    }),
  ]);
  const counts = Object.fromEntries(events.map((item) => [item.type, item._count.type]));
  const recent = await prisma.lead.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { clinic: true, recommendedSpecialty: true },
  });

  const cards = [
    [t("checkerStarts"), counts.checker_start || 0],
    [t("checkerDone"), counts.checker_complete || 0],
    [t("skips"), counts.checker_skip || 0],
    [t("clinicViews"), counts.clinic_view || 0],
    [t("applyStarts"), counts.apply_start || 0],
    [t("requests"), counts.lead_submit || leads],
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">{t("dashboard")}</h1>
        <p className="mt-2 text-muted">
          {clinics} {t("clinics").toLowerCase()} · {leads} {t("leads").toLowerCase()}
        </p>
      </div>
      <section>
        <h2 className="font-display text-2xl">{t("funnel")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-line bg-white p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl">{t("conversion")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">{t("checkerToLead")}</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">{checkerLeads}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">{t("catalogToLead")}</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">{catalogLeads}</p>
          </div>
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{t("recentLeads")}</h2>
          <Link href="/admin/leads" className="text-sm font-semibold text-teal">
            {t("leads")}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-muted">{t("noLeads")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand">
                <tr>
                  <th className="px-4 py-3">{t("patient")}</th>
                  <th className="px-4 py-3">{t("clinic")}</th>
                  <th className="px-4 py-3">{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((lead) => (
                  <tr key={lead.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${lead.id}`} className="font-semibold">
                        {lead.fullName}
                      </Link>
                      <div className="text-muted">{lead.country}</div>
                    </td>
                    <td className="px-4 py-3">
                      {locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn}
                    </td>
                    <td className="px-4 py-3">
                      {lead.createdAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
