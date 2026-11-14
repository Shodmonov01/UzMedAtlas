/** The cities a clinic or branch can be in: the stored value, the English name, and the Russian and Uzbek names
 *  that typed input is also matched against. */
const CITIES = [
  { value: "tashkent", label: "Tashkent", ru: "Ташкент", uz: "Toshkent" },
  { value: "samarkand", label: "Samarkand", ru: "Самарканд", uz: "Samarqand" },
  { value: "bukhara", label: "Bukhara", ru: "Бухара", uz: "Buxoro" },
  { value: "andijan", label: "Andijan", ru: "Андижан", uz: "Andijon" },
  { value: "fergana", label: "Fergana", ru: "Фергана", uz: "Fargʻona" },
  { value: "namangan", label: "Namangan", ru: "Наманган", uz: "Namangan" },
  { value: "nukus", label: "Nukus", ru: "Нукус", uz: "Nukus" },
  { value: "qarshi", label: "Qarshi", ru: "Карши", uz: "Qarshi" },
  { value: "termez", label: "Termez", ru: "Термез", uz: "Termiz" },
  { value: "urgench", label: "Urgench", ru: "Ургенч", uz: "Urganch" },
  { value: "jizzakh", label: "Jizzakh", ru: "Джизак", uz: "Jizzax" },
  { value: "navoi", label: "Navoi", ru: "Навои", uz: "Navoiy" },
  { value: "kokand", label: "Kokand", ru: "Коканд", uz: "Qoʻqon" },
  { value: "margilan", label: "Margilan", ru: "Маргилан", uz: "Margʻilon" },
  { value: "gulistan", label: "Gulistan", ru: "Гулистан", uz: "Guliston" },
] as const;

export const CITY_OPTIONS = CITIES.map(({ value, label }) => ({ value, label }));

/** City value → English name. */
export const CITY_LABELS: Record<string, string> = Object.fromEntries(CITIES.map(({ value, label }) => [value, label]));

const cityAliases = new Map<string, string>(
  CITIES.flatMap(({ value, label, ru, uz }) => [value, label, ru, uz].map((name) => [name.toLowerCase(), value] as [string, string])),
);

/** Typed city (in English, Russian or Uzbek) → stored value; anything unknown stays as typed. */
export function normalizeCity(input: string) {
  const value = input.trim();
  return cityAliases.get(value.toLowerCase()) || value;
}

/** Regions some clinics typed in Russian instead of a city, with their English names. */
const REGIONS: Record<string, string> = {
  "ташкентская область": "Tashkent Region",
  "самаркандская область": "Samarkand Region",
  "бухарская область": "Bukhara Region",
  "андижанская область": "Andijan Region",
  "ферганская область": "Fergana Region",
  "наманганская область": "Namangan Region",
  "кашкадарьинская область": "Kashkadarya Region",
  "сурхандарьинская область": "Surkhandarya Region",
  "хорезмская область": "Khorezm Region",
  "джизакская область": "Jizzakh Region",
  "навоийская область": "Navoi Region",
  "сырдарьинская область": "Syrdarya Region",
  "республика каракалпакстан": "Republic of Karakalpakstan",
};

/** Stored value (or a typed city or region in any language) → English name; anything unknown comes back as it is. */
export function displayCity(input: string | null | undefined) {
  if (!input) return "";
  const key = input.trim().toLowerCase();
  return CITY_LABELS[input] || CITY_LABELS[cityAliases.get(key) || ""] || REGIONS[key] || input;
}

/** A city's name on the public pages (always English now; the language argument is kept for older callers). */
export function cityName(_lang: "ru" | "uz" | "en", input: string | null | undefined) {
  return displayCity(input);
}
