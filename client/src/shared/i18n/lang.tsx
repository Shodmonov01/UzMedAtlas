import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

/** The site is English only. Copy written earlier keeps its Russian and Uzbek next to the English
 *  (t({ ru, uz, en })), and t() always picks the English. */
export type Lang = "ru" | "uz" | "en";
export const SITE_LANG: Lang = "en";

/** A piece of copy in every language, written next to where it is used. */
export type Text = Record<Lang, string>;

const LangContext = createContext<{ lang: Lang } | null>(null);

/** Gives the page its language (always English). */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ lang: SITE_LANG }), []);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** The site language and t() to pick a piece of copy in it. */
export function useLang() {
  const ctx = useContext(LangContext);
  if (ctx === null) throw new Error("useLang must be used inside LanguageProvider");
  const { lang } = ctx;
  const t = useCallback((text: Text) => text[lang], [lang]);
  return { lang, t };
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

/** A name from the API in English, falling back to the Russian when the clinic has no English name yet. */
export function pickName(lang: Lang, ru?: string | null, en?: string | null) {
  if (lang === "en") return en || ru || "";
  return ru || en || "";
}

/** English copy for code written without t(): a count with its noun ("1 clinic", "3 clinics"). */
export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
