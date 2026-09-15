import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ClinicCard } from "@/components/ClinicCard";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { queryClinics } from "@/lib/catalog-query";
import { trackEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function ClinicsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    city?: string;
    specialty?: string;
    service?: string;
    sort?: string;
    lang?: string;
  }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  await trackEvent("catalog_view", {
    q: filters.q || "",
    specialty: filters.specialty || "",
    lang: filters.lang || "",
  });

  const clinics = await queryClinics(filters);
  const hasFilters = Boolean(filters.q || filters.city || filters.specialty || filters.service || filters.lang);
  const suggestions = hasFilters && clinics.length === 0 ? await queryClinics({ sort: "response" }) : [];

  return (
    <div className="portal mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("subtitle")}</p>
      <div className="mt-8">
        <CatalogFilters
          q={filters.q}
          city={filters.city}
          specialty={filters.specialty}
          service={filters.service}
          sort={filters.sort}
          lang={filters.lang}
        />
      </div>
      <p className="mt-6 text-sm font-semibold text-muted">{t("count", { count: clinics.length })}</p>
      <RecentlyViewed />
      {clinics.length === 0 ? (
        <div className="mt-8 space-y-6">
          <p className="rounded-3xl bg-sand p-6">{t("empty")}</p>
          {suggestions.length ? (
            <>
              <h2 className="font-display text-3xl">{t("suggestions")}</h2>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {suggestions.slice(0, 3).map((clinic) => (
                  <ClinicCard key={clinic.id} clinic={clinic} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      )}
    </div>
  );
}
