import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HomeChecker } from "../components/HomeChecker";
import { ClinicCard, type ClinicCardClinic } from "../components/ClinicCard";
import { FaqList } from "../components/FaqList";
import { Greeting } from "../components/Greeting";
import { Avatar } from "../components/Avatar";
import { LocaleLink, useLocale } from "../locale-link";
import { api } from "../api";
import { cityLabel, localized } from "@/lib/format";

type HomeData = {
  clinicCount: number;
  cities: { city: string; count: number }[];
  featured: ClinicCardClinic[];
};

export function HomePage() {
  const locale = useLocale();
  const { t } = useTranslation();
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    api.get<HomeData>("/api/home").then(setData).catch(() => setData({ clinicCount: 0, cities: [], featured: [] }));
  }, []);

  const faqItems = (t("faq.items", { returnObjects: true }) as { q: string; a: string }[]).slice(0, 3);
  const featured = data?.featured ?? [];
  const clinicCount = data?.clinicCount ?? 0;
  const fastest = featured[0];
  const bars = [40, 70, 48, 88, 62, 95, 54, 78, 36, 84];

  return (
    <div className="portal">
      <section className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <p className="text-sm font-bold text-muted">
          {t("home.portal")} <span className="text-ink">/</span> {t("home.live")}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="max-w-3xl text-4xl leading-[1.05] md:text-6xl">
              <Greeting />
              <span className="block text-muted">{t("home.title")}</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted md:text-lg">{t("home.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">
              {clinicCount} {t("home.trustClinics")}
            </span>
            <span className="chip">{t("home.trustLanguages")}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <HomeChecker locale={locale} clinicCount={clinicCount} />
          <div className="grid gap-4">
            <div className="rounded-[2rem] bg-teal-deep p-5 text-white">
              <p className="text-sm font-semibold text-white/70">{t("home.statReply")}</p>
              <p className="mt-2 text-5xl font-extrabold tabular-nums">
                {fastest ? t("home.hoursShort", { hours: fastest.responseHours }) : "12h"}
              </p>
              <p className="mt-1 text-sm text-white/70">{t("home.featured")}</p>
              <div className="spark mt-5">
                {bars.map((height, index) => (
                  <span
                    key={height + index}
                    className={index === 3 || index === 5 ? "on" : ""}
                    style={{ height: `${height}%`, background: index === 5 ? "#c8e6c0" : undefined }}
                  />
                ))}
              </div>
            </div>
            <div className="soft-card rounded-[2rem] bg-white p-5">
              <p className="text-sm font-semibold text-muted">{t("home.trustCities")}</p>
              <div className="mt-4 space-y-3">
                {(data?.cities ?? []).map((item) => (
                  <div key={item.city} className="flex items-center justify-between gap-3">
                    <span className="font-bold">{cityLabel(item.city, locale)}</span>
                    <span className="chip">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[t("home.step1"), t("home.step2"), t("home.step3")].map((step, index) => (
            <div key={step} className="soft-card rounded-[2rem] bg-white p-5">
              <span className="chip">0{index + 1}</span>
              <p className="mt-3 text-lg font-bold leading-snug">{step}</p>
            </div>
          ))}
        </section>
        <p className="mt-4">
          <LocaleLink to="/how-it-works" className="text-sm font-bold text-teal-deep">
            {t("home.howMore")}
          </LocaleLink>
        </p>

        {featured.length ? (
          <section className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-3xl">{t("home.featured")}</h2>
                <LocaleLink to="/clinics" className="text-sm font-bold text-teal-deep">
                  {t("home.allClinics")}
                </LocaleLink>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {featured.slice(0, 4).map((clinic) => (
                  <ClinicCard key={clinic.slug} clinic={clinic} compact />
                ))}
              </div>
            </div>
            <aside className="soft-card h-fit rounded-[2rem] bg-white p-5">
              <h2 className="text-xl font-extrabold">{t("home.fastList")}</h2>
              <ul className="mt-4 space-y-3">
                {featured.map((clinic) => (
                  <li key={clinic.slug}>
                    <LocaleLink to={`/clinics/${clinic.slug}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-mint">
                      <Avatar name={clinic.coordinatorName || clinic.nameEn} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{localized(clinic, locale, "name")}</span>
                        <span className="block text-xs text-muted">
                          {clinic.coordinatorName || cityLabel(clinic.city, locale)}
                        </span>
                      </span>
                      <span className="chip pill-ok">{t("home.hoursShort", { hours: clinic.responseHours })}</span>
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        ) : null}

        <section className="mt-10 pb-8">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-3xl">{t("faq.title")}</h2>
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
