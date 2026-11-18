const CATALOG_SEARCH_KEYS = [
  "q",
  "city",
  "specialty",
  "lang",
  "sort",
  "service",
  "priceMin",
  "priceMax",
  "responseMax",
  "medicalTourism",
] as const;

export type CatalogSearchParams = Partial<Record<(typeof CATALOG_SEARCH_KEYS)[number], string>>;

/** The catalog's URL filters: every known key that holds text is kept, anything else (unknown keys, numbers, lists)
 *  is dropped. A plain function instead of a schema library keeps that library out of the first download. */
export function catalogSearchSchema(input: Record<string, unknown>): CatalogSearchParams {
  const search: CatalogSearchParams = {};
  for (const key of CATALOG_SEARCH_KEYS) {
    const value = input[key];
    if (typeof value === "string") search[key] = value;
  }
  return search;
}
