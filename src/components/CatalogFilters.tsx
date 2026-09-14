import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { CITIES } from "@/lib/constants";
import { cityLabel } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

export async function CatalogFilters({
  q,
  city,
  specialty,
  service,
}: {
  q?: string;
  city?: string;
  specialty?: string;
  service?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("catalog");
  const [specialties, services] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({
      distinct: ["nameEn"],
      select: { nameEn: true, nameRu: true },
      orderBy: { nameEn: "asc" },
    }),
  ]);

  return (
    <form className="grid gap-3 rounded-3xl border border-line bg-white p-4 md:grid-cols-4">
      <label className="text-sm font-semibold">
        {t("search")}
        <input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="field mt-1"
        />
      </label>
      <label className="text-sm font-semibold">
        {t("city")}
        <select name="city" defaultValue={city || ""} className="field mt-1">
          <option value="">{t("allCities")}</option>
          {CITIES.map((item) => (
            <option key={item} value={item}>
              {cityLabel(item, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("specialty")}
        <select name="specialty" defaultValue={specialty || ""} className="field mt-1">
          <option value="">{t("allSpecialties")}</option>
          {specialties.map((item) => (
            <option key={item.slug} value={item.slug}>
              {locale === "ru" ? item.nameRu : item.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("service")}
        <select name="service" defaultValue={service || ""} className="field mt-1">
          <option value="">{t("allServices")}</option>
          {services.map((item) => (
            <option key={item.nameEn} value={item.nameEn}>
              {locale === "ru" ? item.nameRu : item.nameEn}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2 md:col-span-4">
        <button className="btn btn-primary" type="submit">
          {t("applyFilters")}
        </button>
        <Link href="/clinics" className="btn btn-ghost">
          {t("reset")}
        </Link>
      </div>
    </form>
  );
}
