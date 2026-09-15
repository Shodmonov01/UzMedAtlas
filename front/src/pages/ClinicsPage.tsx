import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { CatalogFilters } from "../components/CatalogFilters";
import { ClinicCard, type ClinicCardClinic } from "../components/ClinicCard";
import { RecentlyViewed } from "../components/RecentlyViewed";

export function ClinicsPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const filters = {
    q: params.get("q") || undefined,
    city: params.get("city") || undefined,
    specialty: params.get("specialty") || undefined,
    service: params.get("service") || undefined,
    sort: params.get("sort") || undefined,
    lang: params.get("lang") || undefined,
  };
  const [clinics, setClinics] = useState<ClinicCardClinic[]>([]);
  const [suggestions, setSuggestions] = useState<ClinicCardClinic[]>([]);
  const [specialties, setSpecialties] = useState<{ slug: string; nameEn: string; nameRu: string }[]>([]);

  useEffect(() => {
    const query = params.toString();
    api.get<{ clinics: ClinicCardClinic[]; suggestions: ClinicCardClinic[] }>(`/api/clinics${query ? `?${query}` : ""}`).then((data) => {
      setClinics(data.clinics);
      setSuggestions(data.suggestions);
    });
  }, [params]);

  useEffect(() => {
    api
      .get<{ specialties: { slug: string; nameEn: string; nameRu: string }[] }>("/api/meta")
      .then((data) => setSpecialties(data.specialties));
  }, []);

  return (
    <div className="portal mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">{t("catalog.title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("catalog.subtitle")}</p>
      <div className="mt-8">
        <CatalogFilters {...filters} specialties={specialties} />
      </div>
      <p className="mt-6 text-sm font-semibold text-muted">{t("catalog.count", { count: clinics.length })}</p>
      <RecentlyViewed />
      {clinics.length === 0 ? (
        <div className="mt-8 space-y-6">
          <p className="rounded-3xl bg-sand p-6">{t("catalog.empty")}</p>
          {suggestions.length ? (
            <>
              <h2 className="font-display text-3xl">{t("catalog.suggestions")}</h2>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {suggestions.slice(0, 3).map((clinic) => (
                  <ClinicCard key={clinic.slug} clinic={clinic} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {clinics.map((clinic) => (
            <ClinicCard key={clinic.slug} clinic={clinic} />
          ))}
        </div>
      )}
    </div>
  );
}
