import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { LocaleLink, useLocale, withLocale } from "../locale-link";

type LeadDetail = {
  id: string;
  fullName: string;
  country: string;
  phone: string;
  email: string | null;
  contactMethod: string;
  arrivalType: string;
  arrivalDate: string | null;
  preferredHours: string | null;
  symptoms: string | null;
  medicalNeed: string | null;
  age: number | null;
  gender: string | null;
  duration: string | null;
  source: string;
  status: string;
  forChild: boolean;
  notes: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
  clinic: { nameEn: string; nameRu: string };
  recommendedSpecialty: { nameEn: string; nameRu: string } | null;
  emails: { id: string; toAddress: string; subject: string; status: string }[];
};

export function AdminLeadDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [events, setEvents] = useState<{ id: string; type: string; createdAt: string; meta: string | null }[]>([]);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ lead: LeadDetail; events: { id: string; type: string; createdAt: string; meta: string | null }[] }>(
        `/api/admin/leads/${id}`,
      )
      .then((data) => {
        setLead(data.lead);
        setEvents(data.events);
      })
      .catch(() => navigate(withLocale(locale, "/admin/leads"), { replace: true }));
  }, [id, locale, navigate]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    const form = new FormData(event.currentTarget);
    await api.patch(`/api/admin/leads/${id}`, {
      status: form.get("status"),
      notes: form.get("notes"),
    });
  }

  if (!lead) return null;

  const genderLabel =
    lead.gender === "female"
      ? t("checker.female")
      : lead.gender === "male"
        ? t("checker.male")
        : lead.gender === "prefer_not"
          ? t("checker.preferNot")
          : "—";
  const durationLabel =
    lead.duration === "few_days"
      ? t("checker.fewDays")
      : lead.duration === "few_weeks"
        ? t("checker.fewWeeks")
        : lead.duration === "few_months"
          ? t("checker.fewMonths")
          : lead.duration === "more_than_year"
            ? t("checker.moreThanYear")
            : "—";
  const contactLabel =
    lead.contactMethod === "phone"
      ? t("apply.phoneMethod")
      : lead.contactMethod === "email"
        ? t("apply.emailMethod")
        : lead.contactMethod === "telegram"
          ? t("apply.telegram")
          : t("apply.whatsapp");
  const arrivalLabel =
    lead.arrivalType === "exact"
      ? t("apply.exact")
      : lead.arrivalType === "approximate"
        ? t("apply.approximate")
        : t("apply.undecided");
  const hoursLabel =
    lead.preferredHours === "morning"
      ? t("apply.morning")
      : lead.preferredHours === "afternoon"
        ? t("apply.afternoon")
        : lead.preferredHours === "evening"
          ? t("apply.evening")
          : lead.preferredHours
            ? t("apply.anytime")
            : "—";

  const rows = [
    [t("admin.patient"), lead.fullName],
    [t("admin.country"), lead.country],
    [t("admin.clinic"), locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn],
    [t("admin.contact"), `${lead.phone} · ${contactLabel}`],
    ["Email", lead.email || "—"],
    [t("admin.date"), lead.createdAt.slice(0, 16).replace("T", " ")],
    [t("apply.arrival"), `${arrivalLabel}${lead.arrivalDate ? ` · ${lead.arrivalDate}` : ""}`],
    [t("apply.preferredHours"), hoursLabel],
    [
      t("admin.direction"),
      lead.recommendedSpecialty
        ? locale === "ru"
          ? lead.recommendedSpecialty.nameRu
          : lead.recommendedSpecialty.nameEn
        : "—",
    ],
    [t("checker.symptomsLabel"), lead.symptoms || lead.medicalNeed || "—"],
    [t("checker.age"), lead.age?.toString() || "—"],
    [t("checker.gender"), genderLabel],
    [t("checker.duration"), durationLabel],
    [t("admin.source"), lead.source === "checker" ? t("admin.sourceChecker") : t("admin.sourceCatalog")],
    [t("admin.status"), lead.status],
    [t("checker.forChild"), lead.forChild ? "yes" : "no"],
    ["UTM", [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ") || "—"],
  ];

  return (
    <div className="space-y-6">
      <LocaleLink to="/admin/leads" className="text-sm font-semibold text-muted">
        ← {t("admin.leads")}
      </LocaleLink>
      <h1 className="font-display text-4xl">{lead.fullName}</h1>
      <form onSubmit={save} className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select name="status" defaultValue={lead.status} className="field w-auto">
            <option value="new">{t("admin.statusNew")}</option>
            <option value="contacted">{t("admin.statusContacted")}</option>
            <option value="closed">{t("admin.statusClosed")}</option>
          </select>
        </div>
        <dl className="grid gap-4 rounded-3xl border border-line bg-white p-6 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>
        <label className="block rounded-3xl border border-line bg-white p-6 text-sm font-semibold">
          {t("admin.notes")}
          <textarea name="notes" rows={4} defaultValue={lead.notes || ""} className="field mt-1 font-normal" />
        </label>
        <button className="btn btn-primary" type="submit">
          {t("admin.save")}
        </button>
      </form>
      {lead.emails.length ? (
        <section>
          <h2 className="font-display text-2xl">{t("admin.outbox")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lead.emails.map((email) => (
              <li key={email.id} className="rounded-2xl border border-line bg-white p-4">
                <p className="font-semibold">{email.toAddress}</p>
                <p className="text-muted">
                  {email.subject} · {email.status}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {events.length ? (
        <section>
          <h2 className="font-display text-2xl">{t("admin.sessionEvents")}</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {events.map((event) => (
              <li key={event.id} className="rounded-2xl border border-line bg-white px-4 py-3">
                <span className="font-semibold">{event.type}</span>
                <span className="ml-2 text-muted">
                  {event.createdAt.slice(11, 16)}
                  {event.meta ? ` · ${event.meta}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
