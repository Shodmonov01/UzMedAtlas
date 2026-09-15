import { useTranslation } from "react-i18next";

export function PrivacyPage() {
  const { t } = useTranslation();
  const paragraphs = t("privacy.paragraphs", { returnObjects: true }) as string[];
  return (
    <div className="portal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">{t("privacy.title")}</h1>
      <p className="mt-4 text-sm text-muted">{t("privacy.updated")}</p>
      <div className="mt-8 space-y-4 text-muted leading-relaxed">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
