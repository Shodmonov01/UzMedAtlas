import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** The site's languages: Russian (the original), Uzbek (Latin script) and English. */
export type Lang = "ru" | "uz" | "en";
export const LANGS: { value: Lang; label: string; name: string }[] = [
  { value: "ru", label: "RU", name: "Русский" },
  { value: "uz", label: "UZ", name: "Oʻzbekcha" },
  { value: "en", label: "EN", name: "English" },
];

/** A piece of copy in every language, written next to where it is used. */
export type Text = Record<Lang, string>;

const STORAGE_KEY = "uma_lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ru" || saved === "uz" || saved === "en") return saved;
  } catch {
    // Storage can be blocked; then the site opens in Russian.
  }
  // Russian until the reader picks another language (the inner pages are still Russian only).
  return "ru";
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

/** A name from the API in the current language. The API has Russian and English; Uzbek readers get the Russian. */
export function pickName(lang: Lang, ru?: string | null, en?: string | null) {
  if (lang === "en") return en || ru || "";
  return ru || en || "";
}
