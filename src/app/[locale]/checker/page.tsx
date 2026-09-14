import { getTranslations, setRequestLocale } from "next-intl/server";
import { go } from "@/lib/redirect";
import { completeChecker } from "@/actions/public";
import { getCheckerState } from "@/lib/checker-state";

export const dynamic = "force-dynamic";

export default async function CheckerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checker");
  const state = await getCheckerState();
  if (!state?.symptoms) {
    go("/", locale);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">2 / 2</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{t("title")}</h1>
      <p className="mt-4 rounded-2xl bg-sand p-4 text-sm text-muted">
        <strong className="block text-ink">{t("symptomsLabel")}</strong>
        {state.symptoms}
      </p>
      <form action={completeChecker} className="mt-8 space-y-6">
        <input type="hidden" name="locale" value={locale} />
        <label className="block text-sm font-semibold">
          {t("age")}
          <input
            name="age"
            type="number"
            min={1}
            max={120}
            required
            placeholder={t("agePlaceholder")}
            className="field mt-1"
          />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">{t("gender")}</legend>
          <div className="mt-2 grid gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2">
              <input type="radio" name="gender" value="female" required />
              {t("female")}
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2">
              <input type="radio" name="gender" value="male" />
              {t("male")}
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2">
              <input type="radio" name="gender" value="prefer_not" />
              {t("preferNot")}
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">{t("duration")}</legend>
          <div className="mt-2 grid gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2">
              <input type="radio" name="duration" value="few_days" required />
              {t("fewDays")}
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2">
              <input type="radio" name="duration" value="few_weeks" />
              {t("fewWeeks")}
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2">
              <input type="radio" name="duration" value="few_months" />
              {t("fewMonths")}
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2">
              <input type="radio" name="duration" value="more_than_year" />
              {t("moreThanYear")}
            </label>
          </div>
        </fieldset>
        <button className="btn btn-primary w-full" type="submit">
          {t("submit")}
        </button>
        <p className="text-sm text-muted">{t("disclaimer")}</p>
      </form>
    </div>
  );
}
