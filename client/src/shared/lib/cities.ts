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

/** Regions some clinics typed in Russian instead of a city, with their names in each language. */
const REGION_NAMES: Record<string, { ru: string; uz: string; en: string }> = {
  "ташкентская область": { ru: "Ташкентская область", uz: "Toshkent viloyati", en: "Tashkent Region" },
  "самаркандская область": { ru: "Самаркандская область", uz: "Samarqand viloyati", en: "Samarkand Region" },
  "бухарская область": { ru: "Бухарская область", uz: "Buxoro viloyati", en: "Bukhara Region" },
  "андижанская область": { ru: "Андижанская область", uz: "Andijon viloyati", en: "Andijan Region" },
  "ферганская область": { ru: "Ферганская область", uz: "Fargʻona viloyati", en: "Fergana Region" },
  "наманганская область": { ru: "Наманганская область", uz: "Namangan viloyati", en: "Namangan Region" },
  "кашкадарьинская область": { ru: "Кашкадарьинская область", uz: "Qashqadaryo viloyati", en: "Kashkadarya Region" },
  "сурхандарьинская область": { ru: "Сурхандарьинская область", uz: "Surxondaryo viloyati", en: "Surkhandarya Region" },
  "хорезмская область": { ru: "Хорезмская область", uz: "Xorazm viloyati", en: "Khorezm Region" },
  "джизакская область": { ru: "Джизакская область", uz: "Jizzax viloyati", en: "Jizzakh Region" },
  "навоийская область": { ru: "Навоийская область", uz: "Navoiy viloyati", en: "Navoi Region" },
  "сырдарьинская область": { ru: "Сырдарьинская область", uz: "Sirdaryo viloyati", en: "Syrdarya Region" },
  "республика каракалпакстан": { ru: "Республика Каракалпакстан", uz: "Qoraqalpogʻiston Respublikasi", en: "Republic of Karakalpakstan" },
};
const REGIONS: Record<string, string> = Object.fromEntries(Object.entries(REGION_NAMES).map(([key, names]) => [key, names.en]));

/** Stored value (or a typed city or region in any language) → English name; anything unknown comes back as it is. */
export function displayCity(input: string | null | undefined) {
  if (!input) return "";
  const key = input.trim().toLowerCase();
  return CITY_LABELS[input] || CITY_LABELS[cityAliases.get(key) || ""] || REGIONS[key] || input;
}

/** A city's (or region's) name on the public pages in the site language; anything unknown comes back as it is. */
export function cityName(lang: "ru" | "uz" | "en", input: string | null | undefined) {
  if (!input) return "";
  if (lang === "en") return displayCity(input);
  const key = input.trim().toLowerCase();
  const value = CITY_LABELS[input] ? input : cityAliases.get(key);
  const city = CITIES.find((item) => item.value === value);
  if (city) return city[lang];
  return REGION_NAMES[key]?.[lang] || input;
}
