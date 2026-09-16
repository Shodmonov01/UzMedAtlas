import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClinicCatalog } from "../components/ClinicCatalog";
import { HomeBanners } from "../components/HomeBanners";
import { FaqList } from "../components/FaqList";
import { LocaleLink } from "../locale-link";
import { api } from "../api";
import type { ClinicCardClinic } from "../components/ClinicCard";

type HomeData = {
  featured: ClinicCardClinic[];
};

export function HomePage() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<ClinicCardClinic[]>([]);

  useEffect(() => {
    api
      .get<HomeData>("/api/home")
      .then((data) => setFeatured(data.featured ?? []))
      .catch(() => setFeatured([]));
  }, []);

  const faqItems = (t("faq.items", { returnObjects: true }) as { q: string; a: string }[]).slice(0, 3);

  return (
    <div className="portal">
      <section className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <h1 className="sr-only">{t("catalog.title")}</h1>
        <HomeBanners clinics={featured} />
        <ClinicCatalog basePath="/" />
        <section className="mt-10 pb-8">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl md:text-3xl">{t("faq.title")}</h2>
            <LocaleLink to="/faq" className="text-sm font-bold text-teal-deep">
              {t("home.allFaq")}
            </LocaleLink>
          </div>
          <div className="mt-5">
            <FaqList items={faqItems} />
          </div>
        </section>
      </section>
    </div>
  );
}
