"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { adminLogin } from "@/actions/admin";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("admin");
  const [error, setError] = useState<"invalid" | "rateLimit" | null>(null);

  async function action(formData: FormData) {
    setError(null);
    const result = await adminLogin(formData);
    if (result?.error === "rateLimit") setError("rateLimit");
    else if (result?.error) setError("invalid");
  }

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-line bg-white p-6">
      <input type="hidden" name="locale" value={locale} />
      {error === "invalid" ? <p className="text-sm text-red-700">{t("invalid")}</p> : null}
      {error === "rateLimit" ? <p className="text-sm text-red-700">{t("loginRateLimit")}</p> : null}
      <label className="block text-sm font-semibold">
        {t("password")}
        <input name="password" type="password" required className="field mt-1" autoComplete="current-password" />
      </label>
      <button className="btn btn-primary w-full" type="submit">
        {t("signIn")}
      </button>
    </form>
  );
}
