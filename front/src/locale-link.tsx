import { Link, useLocation, useParams, type LinkProps } from "react-router-dom";
import type { Locale } from "./i18n";

export function useLocale(): Locale {
  const { locale } = useParams();
  return locale === "ru" ? "ru" : "en";
}

export function withLocale(locale: string, to: string) {
  if (to.startsWith("http")) return to;
  const suffix = to === "/" ? "" : to;
  return `/${locale}${suffix}`;
}

export function LocaleLink({ to, ...props }: Omit<LinkProps, "to"> & { to: string }) {
  const locale = useLocale();
  return <Link to={withLocale(locale, to)} {...props} />;
}

export function useLocalePath() {
  const location = useLocation();
  const parts = location.pathname.split("/");
  parts.splice(0, 2);
  return `/${parts.join("/")}`.replace(/\/$/, "") || "/";
}
