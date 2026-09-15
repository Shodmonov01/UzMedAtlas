import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("how");
  const steps = t.raw("steps") as { title: string; body: string }[];
  const limits = t.raw("limits") as string[];

  return (
    <div className="portal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
      <ol className="mt-10 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-3xl border border-line bg-white p-5">
            <span className="text-sm font-bold text-clay">0{index + 1}</span>
            <h2 className="mt-2 font-display text-2xl">{step.title}</h2>
            <p className="mt-2 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      <section className="mt-10">
        <h2 className="font-display text-3xl">{t("limitsTitle")}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
          {limits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
