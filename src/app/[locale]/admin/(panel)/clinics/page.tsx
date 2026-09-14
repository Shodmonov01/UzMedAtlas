import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { toggleClinicPublished } from "@/actions/admin";
import { cityLabel } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AdminClinicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const clinics = await prisma.clinic.findMany({
    orderBy: { nameEn: "asc" },
    include: { _count: { select: { leads: true, services: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl">{t("clinics")}</h1>
        <div className="flex gap-2">
          <a href="/api/admin/clinics.csv" className="btn btn-ghost">
            {t("export")}
          </a>
          <Link href="/admin/clinics/new" className="btn btn-primary">
            {t("newClinic")}
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th className="px-4 py-3">{t("nameEn")}</th>
              <th className="px-4 py-3">{t("city")}</th>
              <th className="px-4 py-3">{t("published")}</th>
              <th className="px-4 py-3">{t("leads")}</th>
            </tr>
          </thead>
          <tbody>
            {clinics.map((clinic) => (
              <tr key={clinic.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link href={`/admin/clinics/${clinic.id}`} className="font-semibold">
                    {locale === "ru" ? clinic.nameRu : clinic.nameEn}
                  </Link>
                </td>
                <td className="px-4 py-3">{cityLabel(clinic.city, locale as Locale)}</td>
                <td className="px-4 py-3">
                  <form action={toggleClinicPublished}>
                    <input type="hidden" name="id" value={clinic.id} />
                    <input
                      type="hidden"
                      name="published"
                      value={clinic.published ? "false" : "true"}
                    />
                    <button className="chip" type="submit">
                      {clinic.published ? t("published") : t("hidden")}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">{clinic._count.leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
