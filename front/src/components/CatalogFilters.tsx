import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { CITIES, SERVICE_LANGUAGES } from "@/lib/constants";
import { CANONICAL_SERVICES } from "@/lib/canonical";
import { cityLabel, cn, languageLabel } from "@/lib/format";
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

type Specialty = { slug: string; nameEn: string; nameRu: string };

function activeExtraCount(values: CatalogFilterValues) {
  return FILTER_KEYS.filter((key) => key !== "q" && values[key]).length;
}

function toQuery(values: CatalogFilterValues) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = String(values[key] || "").trim();
    if (value) params.set(key, value);
  }
  return params.toString();
}

function FilterFields({
  values,
  specialties,
}: {
  values: CatalogFilterValues;
  specialties: Specialty[];
}) {
  const locale = useLocale();
  const { t } = useTranslation();
  return (
    <>
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
          <option value="12">
            {t("catalog.upTo")} 12{locale === "ru" ? " ч" : "h"}
          </option>
          <option value="24">
            {t("catalog.upTo")} 24{locale === "ru" ? " ч" : "h"}
          </option>
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
    </>
  );
}

export function CatalogFilters({
  specialties,
  basePath = "/clinics",
  ...values
}: CatalogFilterValues & {
  specialties: Specialty[];
  basePath?: string;
}) {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const extra = activeExtraCount(values);

  function go(next: CatalogFilterValues) {
    const query = toQuery(next);
    navigate(withLocale(locale, `${basePath}${query ? `?${query}` : ""}`));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: CatalogFilterValues = {};
    for (const key of FILTER_KEYS) {
      const value = String(data.get(key) || "").trim();
      if (value) next[key] = value;
    }
    go(next);
    setOpen(false);
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") || "").trim();
    go({ ...values, q: q || undefined });
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chips: { key: keyof CatalogFilterValues; label: string }[] = [];
  if (values.city) chips.push({ key: "city", label: cityLabel(values.city, locale) });
  if (values.specialty) {
    const item = specialties.find((entry) => entry.slug === values.specialty);
    chips.push({ key: "specialty", label: item ? (locale === "ru" ? item.nameRu : item.nameEn) : values.specialty });
  }
  if (values.service) {
    const item = CANONICAL_SERVICES.find((entry) => entry.slug === values.service);
    chips.push({ key: "service", label: item ? (locale === "ru" ? item.nameRu : item.nameEn) : values.service });
  }
  if (values.lang) chips.push({ key: "lang", label: languageLabel(values.lang, locale) });
  if (values.priceMax) chips.push({ key: "priceMax", label: `${t("catalog.upTo")} $${values.priceMax}` });
  if (values.hoursMax) {
    chips.push({
      key: "hoursMax",
      label: `${t("catalog.upTo")} ${values.hoursMax}${locale === "ru" ? " ч" : "h"}`,
    });
  }
  if (values.messenger) chips.push({ key: "messenger", label: values.messenger === "telegram" ? "Telegram" : "WhatsApp" });
  if (values.coordinator) chips.push({ key: "coordinator", label: t("catalog.hasCoordinator") });

  return (
    <>
      <div className="filter-bar">
        <form onSubmit={onSearch} className="flex gap-2">
          <input
            ref={searchRef}
            name="q"
            defaultValue={values.q}
            placeholder={t("catalog.searchPlaceholder")}
            className="field min-w-0 flex-1"
          />
          <button
            type="button"
            className="btn btn-primary shrink-0 gap-2 px-4"
            onClick={() => {
              const q = searchRef.current?.value.trim();
              if (q !== (values.q || "")) go({ ...values, q: q || undefined });
              setOpen(true);
            }}
          >
            <SlidersHorizontal size={18} />
            <span>{t("catalog.filters")}</span>
            {extra ? <span className="filter-count">{extra}</span> : null}
          </button>
        </form>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CITIES.map((item) => (
            <button
              key={item}
              type="button"
              className={cn("chip shrink-0", values.city === item ? "bg-teal text-white" : "bg-white")}
              onClick={() => go({ ...values, city: values.city === item ? undefined : item })}
            >
              {cityLabel(item, locale)}
            </button>
          ))}
        </div>
        {chips.length ? (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="chip bg-mint"
                onClick={() => go({ ...values, [chip.key]: undefined })}
              >
                {chip.label}
                <X size={14} className="ml-1" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="filter-desktop">
        <p className="text-lg font-extrabold">{t("catalog.filters")}</p>
        <FilterFields values={values} specialties={specialties} />
        <div className="grid gap-2">
          <button className="btn btn-primary w-full" type="submit">
            {t("catalog.applyFilters")}
          </button>
          <LocaleLink to={basePath} className="btn btn-ghost w-full">
            {t("catalog.reset")}
          </LocaleLink>
        </div>
      </form>

      {open ? (
        <>
          <button
            type="button"
            className="filter-backdrop"
            aria-label={t("catalog.closeFilters")}
            onClick={() => setOpen(false)}
          />
          <form onSubmit={onSubmit} className="filter-sheet" role="dialog" aria-modal="true" aria-label={t("catalog.filters")}>
            <div className="filter-handle" />
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-lg font-extrabold">{t("catalog.filters")}</p>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-full bg-mint"
                onClick={() => setOpen(false)}
                aria-label={t("catalog.closeFilters")}
              >
                <X size={18} />
              </button>
            </div>
            <div className="filter-sheet-body">
              <FilterFields values={values} specialties={specialties} />
            </div>
            <div className="filter-sheet-actions">
              <button className="btn btn-primary w-full" type="submit">
                {t("catalog.applyFilters")}
              </button>
              <LocaleLink to={basePath} className="btn btn-ghost w-full" onClick={() => setOpen(false)}>
                {t("catalog.reset")}
              </LocaleLink>
            </div>
          </form>
        </>
      ) : null}
    </>
  );
}
