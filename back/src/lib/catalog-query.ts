import { prisma } from "./db";
import { normalizeText } from "./checker";
import { CANONICAL_SERVICES } from "./canonical";
import { parseLanguages } from "./format";

export type CatalogFiltersInput = {
  q?: string;
  city?: string;
  specialty?: string;
  service?: string;
  sort?: string;
  lang?: string;
  priceMax?: number;
  hoursMax?: number;
  messenger?: string;
  coordinator?: boolean;
};

export type CatalogClinicLike = {
  nameEn: string;
  nameRu: string;
  city: string;
  descriptionEn: string;
  descriptionRu: string;
  languages: string;
  responseHours: number;
  whatsapp?: string | null;
  telegram?: string | null;
  coordinatorName?: string | null;
  specialties: { specialty: { nameEn: string; nameRu: string; slug: string } }[];
  services: {
    nameEn: string;
    nameRu: string;
    canonicalSlug: string | null;
    priceUsd: number | null;
  }[];
};

export function clinicMatchesFilters(clinic: CatalogClinicLike, filters: CatalogFiltersInput) {
  if (filters.lang && !parseLanguages(clinic.languages).includes(filters.lang)) {
    return false;
  }

  const service = filters.service ? normalizeText(filters.service) : "";
  if (service) {
    const canonical = CANONICAL_SERVICES.find(
      (item) =>
        item.slug === filters.service ||
        normalizeText(item.nameEn) === service ||
        normalizeText(item.nameRu) === service,
    );
    const serviceMatch = clinic.services.some((item) => {
      const blob = normalizeText(`${item.nameEn} ${item.nameRu} ${item.canonicalSlug ?? ""}`);
      if (canonical) {
        return (
          item.canonicalSlug === canonical.slug ||
          blob.includes(canonical.slug) ||
          canonical.aliases.some((alias) => blob.includes(normalizeText(alias)))
        );
      }
      return blob.includes(service);
    });
    if (!serviceMatch) return false;
  }

  if (filters.priceMax != null) {
    const from =
      clinic.services
        .map((item) => item.priceUsd)
        .filter((value): value is number => value != null)
        .sort((a, b) => a - b)[0] ?? null;
    if (from == null || from > filters.priceMax) return false;
  }

  if (filters.hoursMax != null && clinic.responseHours > filters.hoursMax) return false;

  if (filters.messenger === "whatsapp" && !clinic.whatsapp) return false;
  if (filters.messenger === "telegram" && !clinic.telegram) return false;
  if (filters.coordinator && !clinic.coordinatorName) return false;

  const q = filters.q ? normalizeText(filters.q) : "";
  if (!q) return true;
  const blob = normalizeText(
    [
      clinic.nameEn,
      clinic.nameRu,
      clinic.city,
      clinic.descriptionEn,
      clinic.descriptionRu,
      ...clinic.specialties.flatMap((item) => [
        item.specialty.nameEn,
        item.specialty.nameRu,
        item.specialty.slug,
      ]),
      ...clinic.services.flatMap((item) => [item.nameEn, item.nameRu, item.canonicalSlug ?? ""]),
    ].join(" "),
  );
  return q.split(" ").filter(Boolean).every((token) => blob.includes(token));
}

export function withFromPrice<T extends { services: { priceUsd: number | null }[] }>(clinic: T) {
  return {
    ...clinic,
    fromPrice:
      clinic.services
        .map((item) => item.priceUsd)
        .filter((value): value is number => value != null)
        .sort((a, b) => a - b)[0] ?? null,
  };
}

export function sortCatalogClinics<
  T extends { nameEn: string; city: string; responseHours: number; fromPrice: number | null },
>(clinics: T[], sort?: string) {
  return [...clinics].sort((a, b) => {
    if (sort === "city") return a.city.localeCompare(b.city) || a.nameEn.localeCompare(b.nameEn);
    if (sort === "price") {
      if (a.fromPrice == null) return 1;
      if (b.fromPrice == null) return -1;
      return a.fromPrice - b.fromPrice;
    }
    if (sort === "response") return a.responseHours - b.responseHours;
    return a.nameEn.localeCompare(b.nameEn, "en", { sensitivity: "base" });
  });
}

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

  const filtered = clinics.filter((clinic) => clinicMatchesFilters(clinic, filters)).map(withFromPrice);
  return sortCatalogClinics(filtered, filters.sort || "name");
}
