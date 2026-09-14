import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { updateLeadStatus } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; source?: string; q?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const q = filters.q?.trim();
  const leads = await prisma.lead.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.source ? { source: filters.source } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
              { country: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { clinic: true, recommendedSpecialty: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">{t("leads")}</h1>
        <a href="/api/admin/leads.csv" className="btn btn-ghost">
          {t("export")}
        </a>
      </div>
      <form className="flex flex-wrap gap-3 rounded-2xl border border-line bg-white p-4">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("searchLeads")}
          className="field w-full max-w-xs"
        />
        <select name="status" defaultValue={filters.status || ""} className="field w-auto">
          <option value="">{t("allStatuses")}</option>
          <option value="new">{t("statusNew")}</option>
          <option value="contacted">{t("statusContacted")}</option>
          <option value="closed">{t("statusClosed")}</option>
        </select>
        <select name="source" defaultValue={filters.source || ""} className="field w-auto">
          <option value="">{t("allSources")}</option>
          <option value="checker">{t("sourceChecker")}</option>
          <option value="catalog">{t("sourceCatalog")}</option>
        </select>
        <button className="btn btn-primary" type="submit">
          {t("filter")}
        </button>
      </form>
      {leads.length === 0 ? (
        <p className="text-muted">{t("noLeads")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand">
              <tr>
                <th className="px-4 py-3">{t("patient")}</th>
                <th className="px-4 py-3">{t("country")}</th>
                <th className="px-4 py-3">{t("clinic")}</th>
                <th className="px-4 py-3">{t("source")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.id}`} className="font-semibold">
                      {lead.fullName}
                    </Link>
                    <div className="text-muted">{lead.phone}</div>
                  </td>
                  <td className="px-4 py-3">{lead.country}</td>
                  <td className="px-4 py-3">
                    {locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn}
                  </td>
                  <td className="px-4 py-3">
                    {lead.source === "checker" ? t("sourceChecker") : t("sourceCatalog")}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateLeadStatus} className="flex gap-2">
                      <input type="hidden" name="id" value={lead.id} />
                      <select name="status" defaultValue={lead.status} className="field py-1">
                        <option value="new">{t("statusNew")}</option>
                        <option value="contacted">{t("statusContacted")}</option>
                        <option value="closed">{t("statusClosed")}</option>
                      </select>
                      <button className="text-xs font-semibold text-teal" type="submit">
                        {t("save")}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">{lead.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
