import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { Avatar } from "../components/Avatar";
import { LocaleLink, useLocale } from "../locale-link";

type Dashboard = {
  clinics: number;
  leads: number;
  checkerLeads: number;
  catalogLeads: number;
  counts: Record<string, number>;
  recent: {
    id: string;
    fullName: string;
    country: string;
    status: string;
    clinic: { nameEn: string; nameRu: string };
  }[];
};

export function AdminHomePage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    api.get<Dashboard>("/api/admin/dashboard").then(setData);
  }, []);

  if (!data) return null;
  const cards = [
    [t("admin.checkerStarts"), data.counts.checker_start || 0],
    [t("admin.checkerDone"), data.counts.checker_complete || 0],
    [t("admin.skips"), data.counts.checker_skip || 0],
    [t("admin.clinicViews"), data.counts.clinic_view || 0],
    [t("admin.applyStarts"), data.counts.apply_start || 0],
    [t("admin.requests"), data.counts.lead_submit || data.leads],
  ];
  const max = Math.max(...cards.map((item) => Number(item[1])), 1);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold text-muted">
          {t("admin.dashboard")} · {data.clinics} {t("admin.clinics").toLowerCase()}
        </p>
        <h1 className="mt-1 text-4xl">{t("admin.funnel")}</h1>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        {cards.map(([label, value], index) => (
          <div
            key={String(label)}
            className={index === 0 ? "rounded-[1.8rem] bg-teal-deep p-5 text-white" : "soft-card rounded-[1.8rem] bg-white p-5"}
          >
            <p className={`text-sm font-semibold ${index === 0 ? "text-white/70" : "text-muted"}`}>{label}</p>
            <p className="mt-2 text-4xl font-extrabold tabular-nums">{value}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className={`h-full rounded-full ${index === 0 ? "bg-lime" : "bg-teal"}`}
                style={{ width: `${Math.max(8, (Number(value) / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="soft-card rounded-[1.8rem] bg-white p-5">
          <p className="text-sm font-semibold text-muted">{t("admin.checkerToLead")}</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">{data.checkerLeads}</p>
        </div>
        <div className="soft-card rounded-[1.8rem] bg-white p-5">
          <p className="text-sm font-semibold text-muted">{t("admin.catalogToLead")}</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">{data.catalogLeads}</p>
        </div>
      </section>
      <section className="soft-card rounded-[1.8rem] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">{t("admin.recentLeads")}</h2>
          <LocaleLink to="/admin/leads" className="text-sm font-bold text-teal-deep">
            {t("admin.leads")}
          </LocaleLink>
        </div>
        {data.recent.length === 0 ? (
          <p className="mt-4 text-muted">{t("admin.noLeads")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.recent.map((lead) => (
              <li key={lead.id}>
                <LocaleLink to={`/admin/leads/${lead.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-mint">
                  <Avatar name={lead.fullName} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{lead.fullName}</span>
                    <span className="block text-xs text-muted">
                      {locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn} · {lead.country}
                    </span>
                  </span>
                  <span className={lead.status === "new" ? "chip pill-wait" : "chip pill-ok"}>
                    {lead.status === "new"
                      ? t("admin.statusNew")
                      : lead.status === "contacted"
                        ? t("admin.statusContacted")
                        : t("admin.statusClosed")}
                  </span>
                </LocaleLink>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
