export const CITY_OPTIONS = [
  { value: "tashkent", label: "Ташкент" },
  { value: "samarkand", label: "Самарканд" },
  { value: "bukhara", label: "Бухара" },
  { value: "andijan", label: "Андижан" },
  { value: "fergana", label: "Фергана" },
  { value: "namangan", label: "Наманган" },
  { value: "nukus", label: "Нукус" },
  { value: "qarshi", label: "Карши" },
  { value: "termez", label: "Термез" },
  { value: "urgench", label: "Ургенч" },
  { value: "jizzakh", label: "Джизак" },
  { value: "navoi", label: "Навои" },
  { value: "kokand", label: "Коканд" },
  { value: "margilan", label: "Маргилан" },
  { value: "gulistan", label: "Гулистан" },
] as const;

const cityAliases = new Map(
  CITY_OPTIONS.flatMap(({ value, label }) => [
    [value.toLowerCase(), value],
    [label.toLowerCase(), value],
  ]),
);

export function normalizeCity(input: string) {
  const value = input.trim();
  return cityAliases.get(value.toLowerCase()) || value;
}

export function displayCity(input: string | null | undefined) {
  if (!input) return "";
  return CITY_OPTIONS.find(({ value }) => value === input)?.label || input;
}

/** City names for the public pages, in each site language (Uzbek in Latin script). */
const CITY_NAMES: Record<string, { uz: string; en: string }> = {
  tashkent: { uz: "Toshkent", en: "Tashkent" },
  samarkand: { uz: "Samarqand", en: "Samarkand" },
  bukhara: { uz: "Buxoro", en: "Bukhara" },
  andijan: { uz: "Andijon", en: "Andijan" },
  fergana: { uz: "Fargʻona", en: "Fergana" },
  namangan: { uz: "Namangan", en: "Namangan" },
  nukus: { uz: "Nukus", en: "Nukus" },
  qarshi: { uz: "Qarshi", en: "Qarshi" },
  termez: { uz: "Termiz", en: "Termez" },
  urgench: { uz: "Urganch", en: "Urgench" },
  jizzakh: { uz: "Jizzax", en: "Jizzakh" },
  navoi: { uz: "Navoiy", en: "Navoi" },
  kokand: { uz: "Qoʻqon", en: "Kokand" },
  margilan: { uz: "Margʻilon", en: "Margilan" },
  gulistan: { uz: "Guliston", en: "Gulistan" },
};

/** A city's name in the given site language (Russian is the stored label); unknown cities come back as they are. */
export function cityName(lang: "ru" | "uz" | "en", input: string | null | undefined) {
  if (!input) return "";
  if (lang !== "ru" && CITY_NAMES[input]) return CITY_NAMES[input][lang];
  return displayCity(input);
}
