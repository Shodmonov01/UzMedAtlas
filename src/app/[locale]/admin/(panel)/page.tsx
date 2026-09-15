import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/Avatar";

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
  const max = Math.max(...cards.map((item) => Number(item[1])), 1);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold text-muted">
          {t("dashboard")} · {clinics} {t("clinics").toLowerCase()}
        </p>
        <h1 className="mt-1 text-4xl">{t("funnel")}</h1>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        {cards.map(([label, value], index) => (
          <div
            key={label}
            className={
              index === 0
                ? "rounded-[1.8rem] bg-teal-deep p-5 text-white"
                : "soft-card rounded-[1.8rem] bg-white p-5"
            }
          >
            <p className={`text-sm font-semibold ${index === 0 ? "text-white/70" : "text-muted"}`}>{label}</p>
            <p className="mt-2 text-4xl font-extrabold tabular-nums">{value}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className={`h-full rounded-full ${index === 0 ? "bg-lime" : "bg-teal"}`}
                style={{ width: `${Math.max(8, (Number(value) / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="soft-card rounded-[1.8rem] bg-white p-5">
          <p className="text-sm font-semibold text-muted">{t("checkerToLead")}</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">{checkerLeads}</p>
        </div>
        <div className="soft-card rounded-[1.8rem] bg-white p-5">
          <p className="text-sm font-semibold text-muted">{t("catalogToLead")}</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">{catalogLeads}</p>
        </div>
      </section>
      <section className="soft-card rounded-[1.8rem] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">{t("recentLeads")}</h2>
          <Link href="/admin/leads" className="text-sm font-bold text-teal-deep">
            {t("leads")}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-muted">{t("noLeads")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recent.map((lead) => (
              <li key={lead.id}>
                <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-mint">
                  <Avatar name={lead.fullName} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{lead.fullName}</span>
                    <span className="block text-xs text-muted">
                      {locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn} · {lead.country}
                    </span>
                  </span>
                  <span className={lead.status === "new" ? "chip pill-wait" : "chip pill-ok"}>
                    {lead.status === "new"
                      ? t("statusNew")
                      : lead.status === "contacted"
                        ? t("statusContacted")
                        : t("statusClosed")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
