import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("success");

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal text-2xl text-white">
        ✓
      </p>
      <h1 className="mt-6 font-display text-4xl md:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("body")}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/clinics" className="btn btn-primary">
          {t("catalog")}
        </Link>
        <Link href="/" className="btn btn-ghost">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
