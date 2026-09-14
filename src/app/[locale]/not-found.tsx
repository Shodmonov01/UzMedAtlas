import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-4xl">{t("notFound")}</h1>
      <Link href="/" className="btn btn-primary mt-6">
        {t("backHome")}
      </Link>
    </div>
  );
}
