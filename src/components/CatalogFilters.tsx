import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { CITIES } from "@/lib/constants";
import { CANONICAL_SERVICES } from "@/lib/canonical";
import { cityLabel } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

export async function CatalogFilters({
  q,
  city,
  specialty,
  service,
  sort,
}: {
  q?: string;
  city?: string;
  specialty?: string;
  service?: string;
  sort?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("catalog");
  const specialties = await prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <form className="grid gap-3 rounded-3xl border border-line bg-white p-4 md:grid-cols-5">
      <label className="text-sm font-semibold md:col-span-2">
        {t("search")}
        <input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="field mt-1" />
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
          {CANONICAL_SERVICES.map((item) => (
            <option key={item.slug} value={item.slug}>
              {locale === "ru" ? item.nameRu : item.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("sort")}
        <select name="sort" defaultValue={sort || "name"} className="field mt-1">
          <option value="name">{t("sortName")}</option>
          <option value="city">{t("sortCity")}</option>
          <option value="price">{t("sortPrice")}</option>
          <option value="response">{t("sortResponse")}</option>
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
