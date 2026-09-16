import { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CITIES, SERVICE_LANGUAGES } from "@/lib/constants";
import { CANONICAL_SERVICES } from "@/lib/canonical";
import { cityLabel, languageLabel } from "@/lib/format";
import { LocaleLink, useLocale, withLocale } from "../locale-link";

export function CatalogFilters({
  q,
  city,
  specialty,
  service,
  sort,
  lang,
  specialties,
}: {
  q?: string;
  city?: string;
  specialty?: string;
  service?: string;
  sort?: string;
  lang?: string;
  specialties: { slug: string; nameEn: string; nameRu: string }[];
}) {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "city", "specialty", "service", "lang", "sort"]) {
      const value = String(data.get(key) || "").trim();
      if (value) params.set(key, value);
    }
    const query = params.toString();
    navigate(withLocale(locale, `/clinics${query ? `?${query}` : ""}`));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-[1.6rem] bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-semibold sm:col-span-2">
        {t("catalog.search")}
        <input name="q" defaultValue={q} placeholder={t("catalog.searchPlaceholder")} className="field mt-1" />
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.city")}
        <select name="city" defaultValue={city || ""} className="field mt-1">
          <option value="">{t("catalog.allCities")}</option>
          {CITIES.map((item) => (
            <option key={item} value={item}>
              {cityLabel(item, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.specialty")}
        <select name="specialty" defaultValue={specialty || ""} className="field mt-1">
          <option value="">{t("catalog.allSpecialties")}</option>
          {specialties.map((item) => (
            <option key={item.slug} value={item.slug}>
              {locale === "ru" ? item.nameRu : item.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.service")}
        <select name="service" defaultValue={service || ""} className="field mt-1">
          <option value="">{t("catalog.allServices")}</option>
          {CANONICAL_SERVICES.map((item) => (
            <option key={item.slug} value={item.slug}>
              {locale === "ru" ? item.nameRu : item.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.language")}
        <select name="lang" defaultValue={lang || ""} className="field mt-1">
          <option value="">{t("catalog.allLanguages")}</option>
          {SERVICE_LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {languageLabel(code, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.sort")}
        <select name="sort" defaultValue={sort || "name"} className="field mt-1">
          <option value="name">{t("catalog.sortName")}</option>
          <option value="city">{t("catalog.sortCity")}</option>
          <option value="price">{t("catalog.sortPrice")}</option>
          <option value="response">{t("catalog.sortResponse")}</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
        <button className="btn btn-primary fab-clear min-h-11 w-full sm:w-auto" type="submit">
          {t("catalog.applyFilters")}
        </button>
        <LocaleLink to="/clinics" className="btn btn-ghost min-h-11 w-full sm:w-auto">
          {t("catalog.reset")}
        </LocaleLink>
      </div>
    </form>
  );
}
