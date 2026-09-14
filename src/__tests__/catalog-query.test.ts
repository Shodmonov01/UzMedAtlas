import { describe, expect, it } from "vitest";
import { clinicMatchesFilters, sortCatalogClinics, withFromPrice } from "@/lib/catalog-query";

const atlas = {
  nameEn: "Atlas Med",
  nameRu: "Атлас Мед",
  city: "tashkent",
  descriptionEn: "Heart and MRI diagnostics",
  descriptionRu: "Кардиология и МРТ",
  languages: JSON.stringify(["en", "ru"]),
  responseHours: 12,
  specialties: [{ specialty: { nameEn: "Cardiology", nameRu: "Кардиология", slug: "cardiology" } }],
  services: [
    { nameEn: "Cardiac MRI", nameRu: "МРТ сердца", canonicalSlug: "mri", priceUsd: 250 },
    { nameEn: "Consult", nameRu: "Консультация", canonicalSlug: "consultation", priceUsd: 40 },
  ],
};

const bukhara = {
  nameEn: "Silk Road Clinic",
  nameRu: "Клиника Шёлковый путь",
  city: "bukhara",
  descriptionEn: "Check-up for guests",
  descriptionRu: "Check-up для гостей",
  languages: JSON.stringify(["ru"]),
  responseHours: 24,
  specialties: [{ specialty: { nameEn: "Diagnostics", nameRu: "Диагностика", slug: "diagnostics" } }],
  services: [{ nameEn: "Check-up", nameRu: "Check-up", canonicalSlug: "checkup", priceUsd: 180 }],
};

describe("catalog filters", () => {
  it("matches case-insensitive search across English and Russian", () => {
    expect(clinicMatchesFilters(atlas, { q: "мрт" })).toBe(true);
    expect(clinicMatchesFilters(atlas, { q: "ATLAS" })).toBe(true);
    expect(clinicMatchesFilters(atlas, { q: "ophthalmology" })).toBe(false);
  });

  it("filters by canonical MRI service", () => {
    expect(clinicMatchesFilters(atlas, { service: "mri" })).toBe(true);
    expect(clinicMatchesFilters(bukhara, { service: "mri" })).toBe(false);
  });

  it("filters by spoken language", () => {
    expect(clinicMatchesFilters(atlas, { lang: "en" })).toBe(true);
    expect(clinicMatchesFilters(bukhara, { lang: "en" })).toBe(false);
  });

  it("sorts by reply time then by price", () => {
    const priced = [withFromPrice(bukhara), withFromPrice(atlas)];
    expect(sortCatalogClinics(priced, "response").map((item) => item.nameEn)).toEqual([
      "Atlas Med",
      "Silk Road Clinic",
    ]);
    expect(sortCatalogClinics(priced, "price")[0].nameEn).toBe("Atlas Med");
  });
});
