import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { ARRIVAL_TYPES, CONTACT_METHODS, COUNTRIES, PREFERRED_HOURS } from "@/lib/constants";
import { DIAL_CODES } from "@/lib/phone";
import { LocaleLink, useLocale, withLocale } from "../locale-link";

export function LeadForm({
  clinicSlug,
  usedChecker,
  checkerSummary,
  afterRequest,
}: {
  clinicSlug: string;
  usedChecker: boolean;
  checkerSummary?: string[];
  afterRequest?: string;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [arrivalType, setArrivalType] = useState("undecided");
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [country, setCountry] = useState("Kazakhstan");
  const [dial, setDial] = useState("+7");
  const [fullName, setFullName] = useState("");
  const [nationalPhone, setNationalPhone] = useState("");
  const [email, setEmail] = useState("");
  const [medicalNeed, setMedicalNeed] = useState("");
  const [preferredHours, setPreferredHours] = useState("anytime");
  const idempotencyKey = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`),
    [],
  );

  useEffect(() => {
    const raw = localStorage.getItem(`uma_draft_${clinicSlug}`);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Record<string, string>;
      if (draft.fullName) setFullName(draft.fullName);
      if (draft.country) setCountry(draft.country);
      if (draft.dial) setDial(draft.dial);
      if (draft.nationalPhone) setNationalPhone(draft.nationalPhone);
      if (draft.email) setEmail(draft.email);
      if (draft.medicalNeed) setMedicalNeed(draft.medicalNeed);
      if (draft.contactMethod) setContactMethod(draft.contactMethod);
      if (draft.arrivalType) setArrivalType(draft.arrivalType);
      if (draft.preferredHours) setPreferredHours(draft.preferredHours);
    } catch {
      /* ignore */
    }
  }, [clinicSlug]);

  useEffect(() => {
    localStorage.setItem(
      `uma_draft_${clinicSlug}`,
      JSON.stringify({
        fullName,
        country,
        dial,
        nationalPhone,
        email,
        medicalNeed,
        contactMethod,
        arrivalType,
        preferredHours,
      }),
    );
  }, [clinicSlug, fullName, country, dial, nationalPhone, email, medicalNeed, contactMethod, arrivalType, preferredHours]);

  function onCountry(value: string) {
    setCountry(value);
    const match = DIAL_CODES.find((item) => item.country === value);
    if (match) setDial(match.dial);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);
    try {
      await api.post("/api/leads", {
        clinicSlug,
        fullName,
        country,
        dial,
        nationalPhone,
        email,
        contactMethod,
        arrivalType,
        arrivalDate: String(form.get("arrivalDate") || ""),
        medicalNeed,
        preferredHours,
        consent: form.get("consent") === "on" ? "on" : "",
        company: String(form.get("company") || ""),
        idempotencyKey,
      });
      localStorage.removeItem(`uma_draft_${clinicSlug}`);
      navigate(withLocale(locale, "/apply/success"));
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "invalid";
      if (code === "emailRequired") setError(t("apply.emailRequired"));
      else if (code === "medicalNeed") setError(t("apply.required"));
      else if (code === "rateLimit") setError(t("apply.rateLimit"));
      else if (code === "consent") setError(t("apply.consentRequired"));
      else if (code === "duplicate") setError(t("apply.duplicate"));
      else setError(t("apply.invalidPhone"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="soft-card space-y-5 rounded-[2rem] bg-white p-6">
      <div className="sr-only" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="rounded-[1.4rem] bg-mint p-4 text-sm">
        <p className="font-semibold">{t("apply.nextTitle")}</p>
        <p className="mt-1 text-muted">{afterRequest || t("apply.nextBody")}</p>
      </div>
      {usedChecker && checkerSummary?.length ? (
        <div className="rounded-[1.4rem] bg-mint p-4 text-sm">
          <p className="font-semibold">{t("apply.checkerSummary")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {checkerSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? (
        <p role="alert" aria-live="polite" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-semibold">
        {t("apply.fullName")}
        <input name="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold">
        {t("apply.country")}
        <select name="country" required className="field mt-1" value={country} onChange={(e) => onCountry(e.target.value)}>
          {COUNTRIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <label className="block text-sm font-semibold">
          {t("apply.dial")}
          <select name="dial" className="field mt-1" value={dial} onChange={(e) => setDial(e.target.value)}>
            {DIAL_CODES.map((item) => (
              <option key={`${item.country}-${item.dial}`} value={item.dial}>
                {item.dial}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          {t("apply.nationalPhone")}
          <input
            name="nationalPhone"
            required
            value={nationalPhone}
            onChange={(e) => setNationalPhone(e.target.value)}
            placeholder="700 000 00 00"
            className="field mt-1"
            inputMode="tel"
            autoComplete="tel-national"
          />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        {t("apply.email")}
        <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1" autoComplete="email" />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">{t("apply.contactMethod")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CONTACT_METHODS.map((method) => (
            <label key={method} className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2">
              <input
                type="radio"
                name="contactMethod"
                value={method}
                checked={contactMethod === method}
                onChange={() => setContactMethod(method)}
              />
              {t(method === "phone" ? "apply.phoneMethod" : method === "email" ? "apply.emailMethod" : `apply.${method}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-semibold">
        {t("apply.preferredHours")}
        <select name="preferredHours" className="field mt-1" value={preferredHours} onChange={(e) => setPreferredHours(e.target.value)}>
          {PREFERRED_HOURS.map((item) => (
            <option key={item} value={item}>
              {t(`apply.${item}`)}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">{t("apply.arrival")}</legend>
        <div className="mt-2 grid gap-2">
          {ARRIVAL_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2">
              <input
                type="radio"
                name="arrivalType"
                value={type}
                checked={arrivalType === type}
                onChange={() => setArrivalType(type)}
              />
              {t(`apply.${type}`)}
            </label>
          ))}
        </div>
        {arrivalType !== "undecided" ? (
          <label className="mt-3 block text-sm font-semibold">
            {t("apply.arrivalDate")}
            <input name="arrivalDate" type="date" className="field mt-1" required />
          </label>
        ) : null}
      </fieldset>
      {!usedChecker ? (
        <label className="block text-sm font-semibold">
          {t("apply.medicalNeed")}
          <textarea
            name="medicalNeed"
            required
            rows={4}
            value={medicalNeed}
            onChange={(e) => setMedicalNeed(e.target.value)}
            placeholder={t("apply.medicalNeedPlaceholder")}
            className="field mt-1"
          />
        </label>
      ) : null}
      <label className="flex items-start gap-3 rounded-2xl border border-line px-3 py-3 text-sm">
        <input name="consent" type="checkbox" required className="mt-1" />
        <span>
          {t("apply.consent")}{" "}
          <LocaleLink to="/privacy" className="font-semibold text-teal underline">
            {t("apply.privacyLink")}
          </LocaleLink>
        </span>
      </label>
      <button className="btn btn-clay w-full text-base" type="submit" disabled={pending}>
        {pending ? "…" : t("apply.submit")}
      </button>
    </form>
  );
}
