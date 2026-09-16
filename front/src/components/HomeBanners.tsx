import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LocaleLink, useLocale } from "../locale-link";
import { cityLabel, localized } from "@/lib/format";
import { ClinicCover } from "./ClinicCover";
import type { ClinicCardClinic } from "./ClinicCard";

export function HomeBanners({ clinics }: { clinics: ClinicCardClinic[] }) {
  const locale = useLocale();
  const { t } = useTranslation();
  const slides = clinics.slice(0, 3);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[index];

  return (
    <section className="banner-frame" aria-label={t("home.banners")}>
      {slide ? (
        <LocaleLink to={`/clinics/${slide.slug}`} className="block h-full">
          <ClinicCover
            src={slide.photos[0]?.url || slide.logoUrl}
            alt={localized(slide, locale, "name")}
            color={slide.coverColor}
            className="h-full w-full object-cover"
          />
          <div className="banner-copy">
            <p className="text-sm font-bold text-white/70">{cityLabel(slide.city, locale)}</p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-white md:text-4xl">
              {localized(slide, locale, "name")}
            </h2>
          </div>
        </LocaleLink>
      ) : (
        <div className="banner-copy">
          <p className="text-sm font-bold text-white/70">{t("home.portal")}</p>
          <h2 className="mt-1 text-2xl font-extrabold text-white md:text-4xl">{t("catalog.title")}</h2>
        </div>
      )}
      {slides.length > 1 ? (
        <div className="banner-dots">
          {slides.map((item, slideIndex) => (
            <button
              key={item.slug}
              type="button"
              className={slideIndex === index ? "on" : ""}
              aria-label={localized(item, locale, "name")}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
