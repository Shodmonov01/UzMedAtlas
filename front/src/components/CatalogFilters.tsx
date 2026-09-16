import { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CITIES, SERVICE_LANGUAGES } from "@/lib/constants";
import { CANONICAL_SERVICES } from "@/lib/canonical";
import { cityLabel, languageLabel } from "@/lib/format";
import { LocaleLink, useLocale, withLocale } from "../locale-link";

const FILTER_KEYS = ["q", "city", "specialty", "service", "lang", "priceMax", "hoursMax", "messenger", "coordinator"] as const;

export type CatalogFilterValues = {
  q?: string;
  city?: string;
  specialty?: string;
  service?: string;
  lang?: string;
  priceMax?: string;
  hoursMax?: string;
  messenger?: string;
  coordinator?: string;
};

export function CatalogFilters({
  specialties,
  basePath = "/clinics",
  ...values
}: CatalogFilterValues & {
  specialties: { slug: string; nameEn: string; nameRu: string }[];
  basePath?: string;
}) {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = String(data.get(key) || "").trim();
      if (value) params.set(key, value);
    }
    const query = params.toString();
    navigate(withLocale(locale, `${basePath}${query ? `?${query}` : ""}`));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-[1.6rem] bg-white p-4">
      <p className="text-lg font-extrabold">{t("catalog.filters")}</p>
      <label className="text-sm font-semibold">
        {t("catalog.search")}
        <input name="q" defaultValue={values.q} placeholder={t("catalog.searchPlaceholder")} className="field mt-1" />
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.city")}
        <select name="city" defaultValue={values.city || ""} className="field mt-1">
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
        <select name="specialty" defaultValue={values.specialty || ""} className="field mt-1">
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
        <select name="service" defaultValue={values.service || ""} className="field mt-1">
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
        <select name="lang" defaultValue={values.lang || ""} className="field mt-1">
          <option value="">{t("catalog.allLanguages")}</option>
          {SERVICE_LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {languageLabel(code, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.priceMax")}
        <select name="priceMax" defaultValue={values.priceMax || ""} className="field mt-1">
          <option value="">{t("catalog.anyPrice")}</option>
          <option value="50">{t("catalog.upTo")} $50</option>
          <option value="100">{t("catalog.upTo")} $100</option>
          <option value="200">{t("catalog.upTo")} $200</option>
          <option value="400">{t("catalog.upTo")} $400</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.hoursMax")}
        <select name="hoursMax" defaultValue={values.hoursMax || ""} className="field mt-1">
          <option value="">{t("catalog.anyHours")}</option>
          <option value="12">{t("catalog.upTo")} 12{locale === "ru" ? " ч" : "h"}</option>
          <option value="24">{t("catalog.upTo")} 24{locale === "ru" ? " ч" : "h"}</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("catalog.messenger")}
        <select name="messenger" defaultValue={values.messenger || ""} className="field mt-1">
          <option value="">{t("catalog.anyMessenger")}</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="coordinator" value="1" defaultChecked={values.coordinator === "1"} />
        {t("catalog.hasCoordinator")}
      </label>
      <div className="grid gap-2">
        <button className="btn btn-primary w-full" type="submit">
          {t("catalog.applyFilters")}
        </button>
        <LocaleLink to={basePath} className="btn btn-ghost w-full">
          {t("catalog.reset")}
        </LocaleLink>
      </div>
    </form>
  );
}
