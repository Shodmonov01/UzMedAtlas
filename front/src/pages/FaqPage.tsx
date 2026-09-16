import { useTranslation } from "react-i18next";
import { FaqList } from "../components/FaqList";

export function FaqPage() {
  const { t } = useTranslation();
  const items = t("faq.items", { returnObjects: true }) as { q: string; a: string }[];
  return (
    <div className="portal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">{t("faq.title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("faq.subtitle")}</p>
      <div className="mt-8">
        <FaqList items={items} />
      </div>
    </div>
  );
}
