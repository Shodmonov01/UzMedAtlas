import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeChecker } from "@/components/HomeChecker";
import { ClinicCard } from "@/components/ClinicCard";
import { FaqList } from "@/components/FaqList";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { queryClinics } from "@/lib/catalog-query";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tFaq = await getTranslations("faq");
  const clinicCount = await prisma.clinic.count({ where: { published: true } });
  await trackEvent("home_view");
  const featured = (await queryClinics({ sort: "response" })).slice(0, 3);
  const faqItems = (tFaq.raw("items") as { q: string; a: string }[]).slice(0, 3);

  return (
    <div className="ornament">
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">
          {t("kicker")}
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.05] md:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{t("subtitle")}</p>
        <div className="mt-10">
          <HomeChecker locale={locale} clinicCount={clinicCount} />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-3xl">{t("howTitle")}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[t("step1"), t("step2"), t("step3")].map((step, index) => (
            <li key={step} className="rounded-3xl border border-line bg-white p-5">
              <span className="text-sm font-bold text-clay">0{index + 1}</span>
              <p className="mt-2 text-lg">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4">
          <Link href="/how-it-works" className="text-sm font-semibold text-teal">
            {t("howMore")}
          </Link>
        </p>
      </section>
      {featured.length ? (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-3xl">{t("featured")}</h2>
            <Link href="/clinics" className="text-sm font-semibold text-teal">
              {t("allClinics")}
            </Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} compact />
            ))}
          </div>
        </section>
      ) : null}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl">{tFaq("title")}</h2>
          <Link href="/faq" className="text-sm font-semibold text-teal">
            {t("allFaq")}
          </Link>
        </div>
        <div className="mt-6">
          <FaqList items={faqItems} />
        </div>
      </section>
    </div>
  );
}
