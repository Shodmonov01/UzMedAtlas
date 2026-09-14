import { prisma } from "./db";
import { normalizeText } from "./checker";
import { CANONICAL_SERVICES } from "./canonical";

export type CatalogFiltersInput = {
  q?: string;
  city?: string;
  specialty?: string;
  service?: string;
  sort?: string;
};

export async function queryClinics(filters: CatalogFiltersInput) {
  const clinics = await prisma.clinic.findMany({
    where: {
      published: true,
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.specialty
        ? { specialties: { some: { specialty: { slug: filters.specialty } } } }
        : {}),
    },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
      services: true,
    },
  });

  const q = filters.q ? normalizeText(filters.q) : "";
  const service = filters.service ? normalizeText(filters.service) : "";

  const filtered = clinics.filter((clinic) => {
    if (service) {
      const canonical = CANONICAL_SERVICES.find(
        (item) => item.slug === filters.service || normalizeText(item.nameEn) === service || normalizeText(item.nameRu) === service,
      );
      const serviceMatch = clinic.services.some((item) => {
        const blob = normalizeText(`${item.nameEn} ${item.nameRu} ${item.canonicalSlug ?? ""}`);
        if (canonical) {
          return item.canonicalSlug === canonical.slug || blob.includes(canonical.slug) || canonical.aliases.some((alias) => blob.includes(normalizeText(alias)));
        }
        return blob.includes(service);
      });
      if (!serviceMatch) return false;
    }
    if (!q) return true;
    const blob = normalizeText(
      [
        clinic.nameEn,
        clinic.nameRu,
        clinic.city,
        clinic.descriptionEn,
        clinic.descriptionRu,
        ...clinic.specialties.flatMap((item) => [item.specialty.nameEn, item.specialty.nameRu, item.specialty.slug]),
        ...clinic.services.flatMap((item) => [item.nameEn, item.nameRu, item.canonicalSlug ?? ""]),
      ].join(" "),
    );
    return q.split(" ").filter(Boolean).every((token) => blob.includes(token));
  });

  const withPrice = filtered.map((clinic) => ({
    ...clinic,
    fromPrice:
      clinic.services
        .map((item) => item.priceUsd)
        .filter((value): value is number => value != null)
        .sort((a, b) => a - b)[0] ?? null,
  }));

  withPrice.sort((a, b) => {
    if (filters.sort === "city") return a.city.localeCompare(b.city) || a.nameEn.localeCompare(b.nameEn);
    if (filters.sort === "price") {
      if (a.fromPrice == null) return 1;
      if (b.fromPrice == null) return -1;
      return a.fromPrice - b.fromPrice;
    }
    if (filters.sort === "response") return a.responseHours - b.responseHours;
    return a.nameEn.localeCompare(b.nameEn);
  });

  return withPrice;
}
