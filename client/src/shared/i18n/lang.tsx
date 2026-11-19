import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** The site's languages: English (the default), Russian and Uzbek (Latin script). */
export type Lang = "ru" | "uz" | "en";
export const LANGS: { value: Lang; label: string; name: string }[] = [
  { value: "en", label: "EN", name: "English" },
  { value: "ru", label: "RU", name: "Русский" },
  { value: "uz", label: "UZ", name: "Oʻzbekcha" },
];

/** A piece of copy in every language, written next to where it is used. */
export type Text = Record<Lang, string>;

const STORAGE_KEY = "uma_lang";

/** The language this browser last picked (English when none). Also read outside the provider, by the opening loader. */
export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ru" || saved === "uz" || saved === "en") return saved;
  } catch {
    // Storage can be blocked; then the site opens in English.
  }
  // English until the reader picks another language in the header.
  return "en";
}

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void } | null>(null);

/** Holds the chosen language, remembers it in this browser and keeps <html lang> in step. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Not remembered across visits then; the switch still works.
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** The current language, a way to change it, and t() to pick a piece of copy in it. */
export function useLang() {
  const ctx = useContext(LangContext);
  if (ctx === null) throw new Error("useLang must be used inside LanguageProvider");
  const { lang, setLang } = ctx;
  const t = useCallback((text: Text) => text[lang], [lang]);
  return { lang, setLang, t };
}

/** A count with its noun in the current language: Russian has three forms (1, 2-4, 5+), English two, Uzbek one. */
export function countWord(lang: Lang, n: number, forms: { ru: [string, string, string]; uz: string; en: [string, string] }) {
  if (lang === "uz") return forms.uz;
  if (lang === "en") return n === 1 ? forms.en[0] : forms.en[1];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms.ru[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.ru[1];
  return forms.ru[2];
}

/** A text in the current language from its Russian, English and Uzbek versions; a missing one falls back to the
 *  Russian (the language clinics write their briefs in), then the English. */
export function pickName(lang: Lang, ru?: string | null, en?: string | null, uz?: string | null) {
  if (lang === "uz") return uz || ru || en || "";
  if (lang === "en") return en || ru || "";
  return ru || en || "";
}

/** A text from the API in the current language: `item[field + "Ru" | "En" | "Uz"]`. Clinics write in Russian; the API
 *  adds the reviewed Uzbek and English translations beside it (server/src/lib/content-i18n.ts), so a page is all in
 *  one language. A text not translated yet shows in Russian. */
export function localText(lang: Lang, item: object | null | undefined, field: string) {
  if (!item) return "";
  const record = item as Record<string, unknown>;
  const get = (suffix: string) => {
    const value = record[field + suffix];
    return typeof value === "string" ? value.trim() : "";
  };
  return pickName(lang, get("Ru"), get("En"), get("Uz"));
}

/** A field kept in one language only (a person's name, an equipment maker) in the current language: the API adds
 *  fooUz and fooEn beside foo when the text is Russian. */
export function plainText(lang: Lang, item: object | null | undefined, key: string) {
  if (!item) return "";
  const record = item as Record<string, unknown>;
  const original = typeof record[key] === "string" ? (record[key] as string) : "";
  if (lang === "ru") return original;
  const translated = record[key + (lang === "uz" ? "Uz" : "En")];
  return typeof translated === "string" && translated ? translated : original;
}

/** A clinic's (or branch's) name: its brand name in Latin letters, the one the catalog sorts by A–Z. The original
 *  from the brief stands in when there is none. */
export function clinicName(item: { nameRu?: string | null; nameEn?: string | null }) {
  return item.nameEn || item.nameRu || "";
}

/** English copy for code written without t(): a count with its noun ("1 clinic", "3 clinics"). */
export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
