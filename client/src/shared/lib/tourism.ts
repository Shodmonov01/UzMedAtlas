import type { Text } from "@/shared/i18n/lang";

/** Travel companies sit in the clinic list with only medical-tourism specialties: they get their own catalog block and
 *  a company profile (no reply time, "About the company"). */
export function isTourismCompany(specialties?: { slug: string }[] | null) {
  return Boolean(specialties?.length) && specialties!.every((s) => s.slug.startsWith("medical-tourism"));
}

/** A travel company's languages: Uzbek, Russian and English first, then any others from its brief; shown with
 *  "and others" after them (COMPANY_LANGUAGES_MORE). */
export function companyLanguages(languages: string[] | null | undefined) {
  return [...new Set(["uz", "ru", "en", ...(languages ?? [])])];
}

export const COMPANY_LANGUAGES_MORE: Text = { ru: "и другие", uz: "va boshqalar", en: "and others" };
