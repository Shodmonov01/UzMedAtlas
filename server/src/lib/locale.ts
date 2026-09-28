export type Locale = "en" | "ru";

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ru";
}
