"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { startChecker, skipChecker } from "@/actions/public";

export function HomeChecker({
  locale,
  clinicCount,
}: {
  locale: string;
  clinicCount: number;
}) {
  const t = useTranslations("home");
  const examples = t.raw("examples") as string[];
  const [symptoms, setSymptoms] = useState("");

  useEffect(() => {
    const last = localStorage.getItem("uma_last_symptoms");
    if (last) setSymptoms(last);
  }, []);

  useEffect(() => {
    if (symptoms) localStorage.setItem("uma_last_symptoms", symptoms);
  }, [symptoms]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form action={startChecker} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="sr-only" htmlFor="symptoms">
          {t("title")}
        </label>
        <textarea
          id="symptoms"
          name="symptoms"
          required
          minLength={8}
          rows={6}
          value={symptoms}
          onChange={(event) => setSymptoms(event.target.value)}
          placeholder={t("placeholder")}
          className="textarea-shadow field min-h-[160px] resize-y rounded-[1.5rem] p-5 text-lg"
        />
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-sm text-muted">{t("examplesLabel")}</span>
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              className="chip"
              onClick={() => setSymptoms(example)}
            >
              {example}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn btn-primary flex-1 text-base" type="submit">
            {t("submit")}
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
      <form action={skipChecker} className="mt-3">
        <input type="hidden" name="locale" value={locale} />
        <button className="btn btn-ghost w-full sm:w-auto" type="submit">
          {t("skip")}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {clinicCount} {t("trustClinics")} · 3 {t("trustCities")} · {t("trustLanguages")}
      </p>
    </div>
  );
}
