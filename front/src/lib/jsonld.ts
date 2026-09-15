import { siteUrl } from "./site";
import { cityLabel, localized, parseLanguages } from "./format";
import type { Locale } from "./format";

export function clinicJsonLd(
  clinic: {
    slug: string;
    nameEn: string;
    nameRu: string;
    city: string;
    addressEn: string;
    addressRu: string;
    descriptionEn: string;
    descriptionRu: string;
    phone: string;
    email: string;
    website: string | null;
    languages: string;
    logoUrl: string | null;
  },
  locale: Locale,
) {
  const name = localized(clinic, locale, "name");
  const description = localized(clinic, locale, "description");
  const address = localized(clinic, locale, "address");
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name,
    description,
    url: `${siteUrl()}/${locale}/clinics/${clinic.slug}`,
    telephone: clinic.phone,
    email: clinic.email,
    image: clinic.logoUrl ? `${siteUrl()}${clinic.logoUrl}` : undefined,
    availableLanguage: parseLanguages(clinic.languages),
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: cityLabel(clinic.city, locale),
      addressCountry: "UZ",
    },
    sameAs: clinic.website ? [clinic.website] : undefined,
  };
}
