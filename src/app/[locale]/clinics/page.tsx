import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ClinicCard } from "@/components/ClinicCard";

export const dynamic = "force-dynamic";

export default async function ClinicsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; city?: string; specialty?: string; service?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");

  const clinics = await prisma.clinic.findMany({
    where: {
      published: true,
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.specialty
        ? { specialties: { some: { specialty: { slug: filters.specialty } } } }
        : {}),
      ...(filters.service
        ? {
            services: {
              some: {
                OR: [
                  { nameEn: { contains: filters.service } },
                  { nameRu: { contains: filters.service } },
                ],
              },
            },
          }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { nameEn: { contains: filters.q } },
              { nameRu: { contains: filters.q } },
              {
                specialties: {
                  some: {
                    specialty: {
                      OR: [
                        { nameEn: { contains: filters.q } },
                        { nameRu: { contains: filters.q } },
                      ],
                    },
                  },
                },
              },
              {
                services: {
                  some: {
                    OR: [
                      { nameEn: { contains: filters.q } },
                      { nameRu: { contains: filters.q } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
    },
    orderBy: { nameEn: "asc" },
  });

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
        />
      </div>
      <p className="mt-6 text-sm font-semibold text-muted">
        {t("count", { count: clinics.length })}
      </p>
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
