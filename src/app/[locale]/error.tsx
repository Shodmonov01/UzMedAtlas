"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-4xl">{t("error")}</h1>
      <p className="mt-3 text-muted">{t("errorBody")}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button className="btn btn-primary" type="button" onClick={reset}>
          {t("retry")}
        </button>
        <Link href="/" className="btn btn-ghost">
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
