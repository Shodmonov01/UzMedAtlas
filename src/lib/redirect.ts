import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function go(href: string, locale: string): never {
  redirect({ href, locale: locale as Locale });
  throw new Error("redirect");
}
