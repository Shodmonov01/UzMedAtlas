import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { LocaleLink, useLocale } from "../locale-link";
import { cityLabel } from "@/lib/format";

type ClinicRow = {
  id: string;
  nameEn: string;
  nameRu: string;
  city: string;
  published: boolean;
  _count: { leads: number };
};

export function AdminClinicsPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [clinics, setClinics] = useState<ClinicRow[]>([]);

  function load() {
    api.get<{ clinics: ClinicRow[] }>("/api/admin/clinics").then((data) => setClinics(data.clinics));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id: string, published: boolean) {
    await api.post(`/api/admin/clinics/${id}/toggle`, { published: !published });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl">{t("admin.clinics")}</h1>
        <div className="flex gap-2">
          <a href="/api/admin/clinics.csv" className="btn btn-ghost">
            {t("admin.export")}
          </a>
          <LocaleLink to="/admin/clinics/new" className="btn btn-primary">
            {t("admin.newClinic")}
          </LocaleLink>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th className="px-4 py-3">{t("admin.nameEn")}</th>
              <th className="px-4 py-3">{t("admin.city")}</th>
              <th className="px-4 py-3">{t("admin.published")}</th>
              <th className="px-4 py-3">{t("admin.leads")}</th>
            </tr>
          </thead>
          <tbody>
            {clinics.map((clinic) => (
              <tr key={clinic.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <LocaleLink to={`/admin/clinics/${clinic.id}`} className="font-semibold">
                    {locale === "ru" ? clinic.nameRu : clinic.nameEn}
                  </LocaleLink>
                </td>
                <td className="px-4 py-3">{cityLabel(clinic.city, locale)}</td>
                <td className="px-4 py-3">
                  <button className="chip" type="button" onClick={() => toggle(clinic.id, clinic.published)}>
                    {clinic.published ? t("admin.published") : t("admin.hidden")}
                  </button>
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
