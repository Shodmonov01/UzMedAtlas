import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../api";
import { useLocale, withLocale } from "../locale-link";

export function AdminLoginPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const [error, setError] = useState<"invalid" | "rateLimit" | null>(null);

  useEffect(() => {
    api.get<{ ok: boolean }>("/api/admin/me").then((data) => {
      if (data.ok) navigate(withLocale(locale, "/admin"), { replace: true });
    });
  }, [locale, navigate]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") || "");
    setError(null);
    try {
      await api.post("/api/admin/login", { password });
      navigate(withLocale(locale, "/admin"));
    } catch (err) {
      setError(err instanceof ApiError && err.code === "rateLimit" ? "rateLimit" : "invalid");
    }
  }

  return (
    <div className="portal mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-4xl">{t("admin.loginTitle")}</h1>
      <form onSubmit={onSubmit} className="soft-card mt-6 space-y-4 rounded-[2rem] bg-white p-6">
        {error === "invalid" ? <p className="text-sm text-red-700">{t("admin.invalid")}</p> : null}
        {error === "rateLimit" ? <p className="text-sm text-red-700">{t("admin.loginRateLimit")}</p> : null}
        <label className="block text-sm font-semibold">
          {t("admin.password")}
          <input name="password" type="password" required className="field mt-1" autoComplete="current-password" />
        </label>
        <button className="btn btn-primary w-full" type="submit">
          {t("admin.signIn")}
        </button>
      </form>
    </div>
  );
}
