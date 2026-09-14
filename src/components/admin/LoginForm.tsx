"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { adminLogin } from "@/actions/admin";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("admin");
  const [error, setError] = useState(false);

  async function action(formData: FormData) {
    setError(false);
    const result = await adminLogin(formData);
    if (result?.error) setError(true);
  }

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-line bg-white p-6">
      <input type="hidden" name="locale" value={locale} />
      {error ? <p className="text-sm text-red-700">{t("invalid")}</p> : null}
      <label className="block text-sm font-semibold">
        {t("password")}
        <input name="password" type="password" required className="field mt-1" />
      </label>
      <button className="btn btn-primary w-full" type="submit">
        {t("signIn")}
      </button>
    </form>
  );
}
