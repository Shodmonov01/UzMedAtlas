import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { LocaleLink, useLocale } from "../locale-link";
import { localized } from "@/lib/format";
import { whatsappLink } from "@/lib/phone";

type SuccessLead = {
  phone: string;
  clinic: {
    nameEn: string;
    nameRu: string;
    responseHours: number;
    whatsapp: string | null;
    phone: string;
  };
};

export function SuccessPage() {
  const locale = useLocale();
  const { t } = useTranslation();
  const [lead, setLead] = useState<SuccessLead | null>(null);

  useEffect(() => {
    api.get<{ lead: SuccessLead | null }>("/api/apply/success").then((data) => setLead(data.lead));
  }, []);

  const hours = lead?.clinic.responseHours ?? 24;
  const wa = lead?.clinic.whatsapp || lead?.clinic.phone;
  const waHref = wa ? whatsappLink(wa) : null;
  const steps = [t("success.step1"), t("success.step2"), t("success.step3")];

  return (
    <div className="portal mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime text-2xl font-black text-teal-deep">
        ✓
      </p>
      <h1 className="mt-6 font-display text-4xl md:text-5xl">{t("success.title")}</h1>
      <p className="mt-4 text-lg text-muted">{t("success.body")}</p>
      {lead ? (
        <p className="mt-4 text-sm font-semibold">
          {localized(lead.clinic, locale, "name")} · {lead.phone}
        </p>
      ) : null}
      <ol className="mt-8 space-y-3 text-left">
        {steps.map((step, index) => (
          <li key={step} className="rounded-2xl border border-line bg-white p-4">
            <span className="text-xs font-extrabold text-teal">0{index + 1}</span>
            <p className="mt-1">{step}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted">{t("success.hours", { hours })}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {waHref ? (
          <a href={waHref} className="btn btn-clay" target="_blank" rel="noreferrer">
            {t("success.whatsappClinic")}
          </a>
        ) : null}
        <LocaleLink to="/clinics" className="btn btn-primary">
          {t("success.catalog")}
        </LocaleLink>
        <LocaleLink to="/" className="btn btn-ghost">
          {t("success.home")}
        </LocaleLink>
      </div>
    </div>
  );
}
