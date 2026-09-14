import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ClinicCard } from "@/components/ClinicCard";
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
  }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  await trackEvent("catalog_view", {
    q: filters.q || "",
    specialty: filters.specialty || "",
  });

  const clinics = await queryClinics(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-5xl">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("subtitle")}</p>
      <div className="mt-8">
        <CatalogFilters
          q={filters.q}
          city={filters.city}
          specialty={filters.specialty}
          service={filters.service}
          sort={filters.sort}
        />
      </div>
      <p className="mt-6 text-sm font-semibold text-muted">{t("count", { count: clinics.length })}</p>
      {clinics.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-sand p-6">{t("empty")}</p>
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
