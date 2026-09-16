import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { CatalogFilters } from "./CatalogFilters";
import { ClinicCard, type ClinicCardClinic } from "./ClinicCard";
import { useLocale } from "../locale-link";
import { localized } from "@/lib/format";

export function ClinicCatalog({ basePath = "/clinics" }: { basePath?: string }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [params] = useSearchParams();
  const filters = {
    q: params.get("q") || undefined,
    city: params.get("city") || undefined,
    specialty: params.get("specialty") || undefined,
    service: params.get("service") || undefined,
    lang: params.get("lang") || undefined,
    priceMax: params.get("priceMax") || undefined,
    hoursMax: params.get("hoursMax") || undefined,
    messenger: params.get("messenger") || undefined,
    coordinator: params.get("coordinator") || undefined,
  };
  const [clinics, setClinics] = useState<ClinicCardClinic[]>([]);
  const [suggestions, setSuggestions] = useState<ClinicCardClinic[]>([]);
  const [specialties, setSpecialties] = useState<{ slug: string; nameEn: string; nameRu: string }[]>([]);

  useEffect(() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) query.set(key, value);
    }
    query.set("sort", "name");
    const suffix = query.toString();
    api.get<{ clinics: ClinicCardClinic[]; suggestions: ClinicCardClinic[] }>(`/api/clinics?${suffix}`).then((data) => {
      setClinics(data.clinics);
      setSuggestions(data.suggestions);
    });
  }, [params]);

  useEffect(() => {
    api
      .get<{ specialties: { slug: string; nameEn: string; nameRu: string }[] }>("/api/meta")
      .then((data) => setSpecialties(data.specialties));
  }, []);

  const ordered = useMemo(
    () =>
      [...clinics].sort((a, b) =>
        localized(a, locale, "name").localeCompare(localized(b, locale, "name"), locale, { sensitivity: "base" }),
      ),
    [clinics, locale],
  );

  const orderedSuggestions = useMemo(
    () =>
      [...suggestions].sort((a, b) =>
        localized(a, locale, "name").localeCompare(localized(b, locale, "name"), locale, { sensitivity: "base" }),
      ),
    [suggestions, locale],
  );

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="order-2 lg:order-1">
        <p className="text-sm font-semibold text-muted">{t("catalog.count", { count: ordered.length })}</p>
        {ordered.length === 0 ? (
          <div className="mt-6 space-y-6">
            <p className="rounded-3xl bg-sand p-6">{t("catalog.empty")}</p>
            {orderedSuggestions.length ? (
              <>
                <h2 className="text-2xl font-extrabold">{t("catalog.suggestions")}</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  {orderedSuggestions.slice(0, 3).map((clinic) => (
                    <ClinicCard key={clinic.slug} clinic={clinic} />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {ordered.map((clinic) => (
              <ClinicCard key={clinic.slug} clinic={clinic} />
            ))}
          </div>
        )}
      </div>
      <aside className="order-1 h-fit lg:sticky lg:top-24 lg:order-2">
        <CatalogFilters key={params.toString()} {...filters} specialties={specialties} basePath={basePath} />
      </aside>
    </div>
  );
}
