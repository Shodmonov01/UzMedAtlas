import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { LocaleLink, useLocale } from "../locale-link";

type Lead = {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  source: string;
  status: string;
  createdAt: string;
  clinic: { nameEn: string; nameRu: string };
};

export function AdminLeadsPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [params, setParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const q = params.get("q") || "";
  const status = params.get("status") || "";
  const source = params.get("source") || "";

  function load(next = params) {
    const query = next.toString();
    api.get<{ leads: Lead[] }>(`/api/admin/leads${query ? `?${query}` : ""}`).then((data) => setLeads(data.leads));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["q", "status", "source"]) {
      const value = String(data.get(key) || "").trim();
      if (value) next.set(key, value);
    }
    setParams(next);
  }

  async function saveStatus(id: string, nextStatus: string) {
    await api.patch(`/api/admin/leads/${id}`, { status: nextStatus });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">{t("admin.leads")}</h1>
        <a href="/api/admin/leads.csv" className="btn btn-ghost">
          {t("admin.export")}
        </a>
      </div>
      <form onSubmit={filter} className="flex flex-wrap gap-3 rounded-2xl border border-line bg-white p-4">
        <input name="q" defaultValue={q} placeholder={t("admin.searchLeads")} className="field w-full max-w-xs" />
        <select name="status" defaultValue={status} className="field w-auto">
          <option value="">{t("admin.allStatuses")}</option>
          <option value="new">{t("admin.statusNew")}</option>
          <option value="contacted">{t("admin.statusContacted")}</option>
          <option value="closed">{t("admin.statusClosed")}</option>
        </select>
        <select name="source" defaultValue={source} className="field w-auto">
          <option value="">{t("admin.allSources")}</option>
          <option value="checker">{t("admin.sourceChecker")}</option>
          <option value="catalog">{t("admin.sourceCatalog")}</option>
        </select>
        <button className="btn btn-primary" type="submit">
          {t("admin.filter")}
        </button>
      </form>
      {leads.length === 0 ? (
        <p className="text-muted">{t("admin.noLeads")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand">
              <tr>
                <th className="px-4 py-3">{t("admin.patient")}</th>
                <th className="px-4 py-3">{t("admin.country")}</th>
                <th className="px-4 py-3">{t("admin.clinic")}</th>
                <th className="px-4 py-3">{t("admin.source")}</th>
                <th className="px-4 py-3">{t("admin.status")}</th>
                <th className="px-4 py-3">{t("admin.date")}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <LocaleLink to={`/admin/leads/${lead.id}`} className="font-semibold">
                      {lead.fullName}
                    </LocaleLink>
                    <div className="text-muted">{lead.phone}</div>
                  </td>
                  <td className="px-4 py-3">{lead.country}</td>
                  <td className="px-4 py-3">{locale === "ru" ? lead.clinic.nameRu : lead.clinic.nameEn}</td>
                  <td className="px-4 py-3">
                    {lead.source === "checker" ? t("admin.sourceChecker") : t("admin.sourceCatalog")}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const next = String(new FormData(event.currentTarget).get("status"));
                        saveStatus(lead.id, next);
                      }}
                    >
                      <select name="status" defaultValue={lead.status} className="field py-1">
                        <option value="new">{t("admin.statusNew")}</option>
                        <option value="contacted">{t("admin.statusContacted")}</option>
                        <option value="closed">{t("admin.statusClosed")}</option>
                      </select>
                      <button className="text-xs font-semibold text-teal" type="submit">
                        {t("admin.save")}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">{lead.createdAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
