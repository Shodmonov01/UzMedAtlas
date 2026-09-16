import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useLocale, withLocale } from "../locale-link";
import { DoctorPortrait } from "./DoctorPortrait";

export function HomeChecker({ locale, clinicCount }: { locale: string; clinicCount: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loc = useLocale();
  const examples = t("home.examples", { returnObjects: true }) as string[];
  const [symptoms, setSymptoms] = useState("");

  useEffect(() => {
    const last = localStorage.getItem("uma_last_symptoms");
    if (last) setSymptoms(last);
  }, []);

  useEffect(() => {
    if (symptoms) localStorage.setItem("uma_last_symptoms", symptoms);
  }, [symptoms]);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api.post("/api/checker/start", { symptoms });
    navigate(withLocale(loc, "/checker"));
  }

  async function skip() {
    await api.post("/api/checker/skip");
    navigate(withLocale(loc, "/clinics"));
  }

  return (
    <div className="relative h-full rounded-[1.6rem] bg-white p-4 pb-20 shadow-[0_18px_50px_-28px_rgba(20,36,33,0.35)] sm:rounded-[2rem] sm:p-6">
      <div className="mb-3 flex items-center gap-3">
        <DoctorPortrait className="h-12 w-12 rounded-2xl" />
        <div>
          <p className="text-sm font-extrabold">{t("home.talkHint")}</p>
          <p className="text-xs font-bold text-muted">
            <span className="live-dot mr-1 align-middle" />
            {t("home.live")}
          </p>
        </div>
      </div>
      <form onSubmit={start} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="sr-only" htmlFor="symptoms">
          {t("home.title")}
        </label>
        <textarea
          id="symptoms"
          name="symptoms"
          required
          minLength={8}
          rows={6}
          value={symptoms}
          onChange={(event) => setSymptoms(event.target.value)}
          placeholder={t("home.placeholder")}
          className="field min-h-[160px] resize-y rounded-[1.25rem] p-4 text-base sm:min-h-[180px] sm:rounded-[1.5rem] sm:p-5 md:text-lg"
          style={{ background: "#e7f3e4" }}
        />
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-sm font-semibold text-muted">{t("home.examplesLabel")}</span>
          {examples.map((example) => (
            <button key={example} type="button" className="chip" onClick={() => setSymptoms(example)}>
              {example}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn btn-primary flex-1 text-base" type="submit">
            {t("home.submit")}
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          skip();
        }}
      >
        <button className="btn btn-ghost w-full sm:w-auto" type="submit">
          {t("home.skip")}
        </button>
      </form>
      <p className="mt-4 text-sm font-semibold text-muted">
        {clinicCount} {t("home.trustClinics")} · 3 {t("home.trustCities")} · {t("home.trustLanguages")}
      </p>
    </div>
  );
}
