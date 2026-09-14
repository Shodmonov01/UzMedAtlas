import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { clinic: true, recommendedSpecialty: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("leads")}</h1>
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
                <th className="px-4 py-3">{t("direction")}</th>
                <th className="px-4 py-3">{t("contact")}</th>
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
                  </td>
                  <td className="px-4 py-3">{lead.country}</td>
                  <td className="px-4 py-3">
                    {locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn}
                  </td>
                  <td className="px-4 py-3">
                    {lead.recommendedSpecialty
                      ? locale === "ru"
                        ? lead.recommendedSpecialty.nameRu
                        : lead.recommendedSpecialty.nameEn
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.phone}
                    <div className="text-muted">{lead.contactMethod}</div>
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
