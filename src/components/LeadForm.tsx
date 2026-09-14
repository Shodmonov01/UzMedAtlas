"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitLead } from "@/actions/public";
import { ARRIVAL_TYPES, CONTACT_METHODS, COUNTRIES } from "@/lib/constants";

export function LeadForm({
  locale,
  clinicSlug,
  usedChecker,
  checkerSummary,
}: {
  locale: string;
  clinicSlug: string;
  usedChecker: boolean;
  checkerSummary?: string[];
}) {
  const t = useTranslations("apply");
  const [error, setError] = useState<string | null>(null);
  const [arrivalType, setArrivalType] = useState("undecided");
  const [contactMethod, setContactMethod] = useState("whatsapp");

  async function action(formData: FormData) {
    setError(null);
    const result = await submitLead(formData);
    if (result?.error === "emailRequired") setError(t("emailRequired"));
    else if (result?.error === "medicalNeed") setError(t("required"));
    else if (result?.error) setError(t("invalidPhone"));
  }

  return (
    <form action={action} className="space-y-5 rounded-3xl border border-line bg-white p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="clinicSlug" value={clinicSlug} />

      {usedChecker && checkerSummary?.length ? (
        <div className="rounded-2xl bg-sand p-4 text-sm">
          <p className="font-semibold">{t("checkerSummary")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {checkerSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <label className="block text-sm font-semibold">
        {t("fullName")}
        <input name="fullName" required className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold">
        {t("country")}
        <select name="country" required className="field mt-1" defaultValue="Kazakhstan">
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        {t("phone")}
        <input
          name="phone"
          required
          placeholder={t("phonePlaceholder")}
          className="field mt-1"
        />
      </label>
      <label className="block text-sm font-semibold">
        {t("email")}
        <input name="email" type="email" className="field mt-1" />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold">{t("contactMethod")}</legend>
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
              {t(
                method === "phone"
                  ? "phoneMethod"
                  : method === "email"
                    ? "emailMethod"
                    : method,
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">{t("arrival")}</legend>
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
              {t(type)}
            </label>
          ))}
        </div>
        {arrivalType !== "undecided" ? (
          <label className="mt-3 block text-sm font-semibold">
            {t("arrivalDate")}
            <input name="arrivalDate" type="date" className="field mt-1" required />
          </label>
        ) : null}
      </fieldset>

      {!usedChecker ? (
        <label className="block text-sm font-semibold">
          {t("medicalNeed")}
          <textarea
            name="medicalNeed"
            required
            rows={4}
            placeholder={t("medicalNeedPlaceholder")}
            className="field mt-1"
          />
        </label>
      ) : null}

      <button className="btn btn-clay w-full text-base" type="submit">
        {t("submit")}
      </button>
    </form>
  );
}
