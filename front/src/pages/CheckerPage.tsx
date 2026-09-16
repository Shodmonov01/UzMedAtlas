import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useLocale, withLocale } from "../locale-link";

export function CheckerPage() {
  const locale = useLocale();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ state: { symptoms?: string } | null }>("/api/checker/state")
      .then((data) => {
        if (!data.state?.symptoms) navigate(withLocale(locale, "/"), { replace: true });
        else setSymptoms(data.state.symptoms);
      })
      .catch(() => navigate(withLocale(locale, "/"), { replace: true }));
  }, [locale, navigate]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.post("/api/checker/complete", {
      age: Number(form.get("age")),
      gender: form.get("gender"),
      duration: form.get("duration"),
      forChild: form.get("forChild") === "on",
    });
    navigate(withLocale(locale, "/checker/results"));
  }

  if (!symptoms) return null;

  return (
    <div className="portal mx-auto max-w-2xl px-4 py-6 md:py-12">
      <p className="chip w-fit">2 / 2</p>
      <h1 className="mt-4 text-4xl md:text-5xl">{t("checker.title")}</h1>
      <p className="mt-4 rounded-[1.5rem] bg-white p-4 text-sm text-muted shadow-sm">
        <strong className="block text-ink">{t("checker.symptomsLabel")}</strong>
        {symptoms}
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <label className="block text-sm font-semibold">
          {t("checker.age")}
          <input name="age" type="number" min={1} max={120} required placeholder={t("checker.agePlaceholder")} className="field mt-1" />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">{t("checker.gender")}</legend>
          <div className="mt-2 grid gap-2">
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3">
              <input type="radio" name="gender" value="female" required />
              {t("checker.female")}
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3">
              <input type="radio" name="gender" value="male" />
              {t("checker.male")}
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3">
              <input type="radio" name="gender" value="prefer_not" />
              {t("checker.preferNot")}
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">{t("checker.duration")}</legend>
          <div className="mt-2 grid gap-2">
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3">
              <input type="radio" name="duration" value="few_days" required />
              {t("checker.fewDays")}
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3">
              <input type="radio" name="duration" value="few_weeks" />
              {t("checker.fewWeeks")}
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3">
              <input type="radio" name="duration" value="few_months" />
              {t("checker.fewMonths")}
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3">
              <input type="radio" name="duration" value="more_than_year" />
              {t("checker.moreThanYear")}
            </label>
          </div>
        </fieldset>
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-3 text-sm font-semibold">
          <input type="checkbox" name="forChild" />
          {t("checker.forChild")}
        </label>
        <button className="btn btn-primary w-full" type="submit">
          {t("checker.submit")}
        </button>
        <p className="text-sm text-muted">{t("checker.disclaimer")}</p>
      </form>
    </div>
  );
}
