import { getTranslations, setRequestLocale } from "next-intl/server";
import { FaqList } from "@/components/FaqList";

export const dynamic = "force-dynamic";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <div className="portal mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
      <div className="mt-8">
        <FaqList items={items} />
      </div>
    </div>
  );
}
