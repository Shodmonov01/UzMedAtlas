import type { Locale } from "@/i18n/routing";

type LocalizedFields = {
  nameEn: string;
  nameRu: string;
  descriptionEn?: string;
  descriptionRu?: string;
  explanationEn?: string;
  explanationRu?: string;
  addressEn?: string;
  addressRu?: string;
  altEn?: string;
  altRu?: string;
};

export function localized<T extends LocalizedFields>(
  item: T,
  locale: Locale,
  field: "name" | "description" | "explanation" | "address" | "alt",
) {
  const suffix = locale === "ru" ? "Ru" : "En";
  const value = item[`${field}${suffix}` as keyof T];
  return typeof value === "string" ? value : "";
}

export function cityLabel(city: string, locale: Locale) {
  const map: Record<string, { en: string; ru: string }> = {
    tashkent: { en: "Tashkent", ru: "Ташкент" },
    samarkand: { en: "Samarkand", ru: "Самарканд" },
    bukhara: { en: "Bukhara", ru: "Бухара" },
  };
  return map[city]?.[locale] ?? city;
}

export function parseLanguages(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function languageLabel(code: string, locale: Locale) {
  const map: Record<string, { en: string; ru: string }> = {
    en: { en: "English", ru: "английский" },
    ru: { en: "Russian", ru: "русский" },
    uz: { en: "Uzbek", ru: "узбекский" },
    kz: { en: "Kazakh", ru: "казахский" },
    tr: { en: "Turkish", ru: "турецкий" },
    ar: { en: "Arabic", ru: "арабский" },
  };
  return map[code]?.[locale] ?? code;
}

export function formatPrice(priceUsd: number | null, locale: Locale) {
  if (priceUsd == null) {
    return locale === "ru" ? "по запросу" : "on request";
  }
  return `$${priceUsd}`;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
