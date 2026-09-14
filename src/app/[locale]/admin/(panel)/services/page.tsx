import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { saveService, deleteService } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const [clinics, specialties, services] = await Promise.all([
    prisma.clinic.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({
      include: { clinic: true, specialty: true },
      orderBy: { nameEn: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">{t("services")}</h1>
      <form action={saveService} className="grid gap-3 rounded-3xl border border-line bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          {t("clinic")}
          <select name="clinicId" required className="field mt-1">
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {locale === "ru" ? clinic.nameRu : clinic.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("specialty")}
          <select name="specialtyId" required className="field mt-1">
            {specialties.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === "ru" ? item.nameRu : item.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("nameEn")}
          <input name="nameEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("nameRu")}
          <input name="nameRu" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("descriptionEn")}
          <textarea name="descriptionEn" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("descriptionRu")}
          <textarea name="descriptionRu" required className="field mt-1" />
        </label>
        <label className="text-sm font-semibold">
          {t("canonical")}
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
          {t("priceUsd")}
          <input name="priceUsd" type="number" min="0" className="field mt-1" />
        </label>
        <div className="flex items-end">
          <button className="btn btn-primary" type="submit">
            {t("addService")}
          </button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th className="px-4 py-3">{t("clinic")}</th>
              <th className="px-4 py-3">{t("specialty")}</th>
              <th className="px-4 py-3">{t("nameEn")}</th>
              <th className="px-4 py-3">{t("priceUsd")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-t border-line">
                <td className="px-4 py-3">
                  {locale === "ru" ? service.clinic.nameRu : service.clinic.nameEn}
                </td>
                <td className="px-4 py-3">
                  {locale === "ru" ? service.specialty.nameRu : service.specialty.nameEn}
                </td>
                <td className="px-4 py-3">{locale === "ru" ? service.nameRu : service.nameEn}</td>
                <td className="px-4 py-3">{service.priceUsd ? `$${service.priceUsd}` : "—"}</td>
                <td className="px-4 py-3">
                  <form action={deleteService}>
                    <input type="hidden" name="id" value={service.id} />
                    <button className="text-red-700" type="submit">
                      {t("delete")}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
