import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  const paragraphs = t.raw("paragraphs") as string[];

  return (
    <div className="portal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">{t("title")}</h1>
      <p className="mt-4 text-sm text-muted">{t("updated")}</p>
      <div className="mt-8 space-y-4 text-muted leading-relaxed">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
