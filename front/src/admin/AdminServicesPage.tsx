import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useLocale } from "../locale-link";

type Named = { id: string; nameEn: string; nameRu: string };
type Service = {
  id: string;
  nameEn: string;
  nameRu: string;
  priceUsd: number | null;
  clinic: Named;
  specialty: Named;
};

export function AdminServicesPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [clinics, setClinics] = useState<Named[]>([]);
  const [specialties, setSpecialties] = useState<Named[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  function load() {
    api
      .get<{ clinics: Named[]; specialties: Named[]; services: Service[] }>("/api/admin/services")
      .then((data) => {
        setClinics(data.clinics);
        setSpecialties(data.specialties);
        setServices(data.services);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await api.post("/api/admin/services", Object.fromEntries(new FormData(form).entries()));
    form.reset();
    load();
  }

  async function remove(id: string) {
    await api.delete(`/api/admin/services/${id}`);
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">{t("admin.services")}</h1>
      <form onSubmit={save} className="grid gap-3 rounded-3xl border border-line bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          {t("admin.clinic")}
          <select name="clinicId" required className="field mt-1">
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {locale === "ru" ? clinic.nameRu : clinic.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("admin.specialty")}
          <select name="specialtyId" required className="field mt-1">
            {specialties.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === "ru" ? item.nameRu : item.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("admin.nameEn")}
          <input name="nameEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.nameRu")}
          <input name="nameRu" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.descriptionEn")}
          <textarea name="descriptionEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.descriptionRu")}
          <textarea name="descriptionRu" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("admin.canonical")}
          <select name="canonicalSlug" className="field mt-1" defaultValue="">
            <option value="">—</option>
            <option value="mri">MRI / МРТ</option>
            <option value="ct">CT / КТ</option>
            <option value="ultrasound">Ultrasound / УЗИ</option>
            <option value="checkup">Check-up</option>
            <option value="consultation">Consultation</option>
            <option value="surgery">Surgery</option>
            <option value="endoscopy">Endoscopy</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("admin.priceUsd")}
          <input name="priceUsd" type="number" min="0" className="field mt-1" />
        </label>
        <div className="flex items-end">
          <button className="btn btn-primary" type="submit">
            {t("admin.addService")}
          </button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th className="px-4 py-3">{t("admin.clinic")}</th>
              <th className="px-4 py-3">{t("admin.specialty")}</th>
              <th className="px-4 py-3">{t("admin.nameEn")}</th>
              <th className="px-4 py-3">{t("admin.priceUsd")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-t border-line">
                <td className="px-4 py-3">{locale === "ru" ? service.clinic.nameRu : service.clinic.nameEn}</td>
                <td className="px-4 py-3">{locale === "ru" ? service.specialty.nameRu : service.specialty.nameEn}</td>
                <td className="px-4 py-3">{locale === "ru" ? service.nameRu : service.nameEn}</td>
                <td className="px-4 py-3">{service.priceUsd ? `$${service.priceUsd}` : "—"}</td>
                <td className="px-4 py-3">
                  <button className="text-red-700" type="button" onClick={() => remove(service.id)}>
                    {t("admin.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
