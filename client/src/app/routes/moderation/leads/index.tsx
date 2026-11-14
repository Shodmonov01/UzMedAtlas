import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminMe, fetchAdminLeads } from "@/shared/api/cabinet";
import { LeadStatusBadge } from "@/shared/ui/StatusBadge";
import { PageHead, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/moderation/leads/")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : undefined,
    source: typeof search.source === "string" ? search.source : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: AdminLeadsPage,
});

const STATUSES = [
  { value: undefined, label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "In contact" },
  { value: "closed", label: "Closed" },
];

function AdminLeadsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q || "");
  const auth = useQuery({ queryKey: ["admin-me"], queryFn: adminMe, retry: false });
  const leads = useQuery({
    queryKey: ["admin-leads", search],
    queryFn: () => fetchAdminLeads(search),
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/moderation/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (auth.isLoading || !auth.data) return <WsLoading label="Checking your session…" />;

  const go = (next: Partial<typeof search>) => void navigate({ to: "/moderation/leads", search: { ...search, ...next } });

  return (
    <div className="ws-stack">
      <PageHead
        eyebrow="Moderation"
        title="Patient requests"
        lead="All requests from clinic pages and Health Checker. Each clinic sees its own in the cabinet; this is the full list."
      />

      <div className="ws-toolbar">
        <div className="flex flex-wrap gap-2">
          <div className="ws-seg" role="tablist" aria-label="Status">
            {STATUSES.map((item) => (
              <button
                key={item.label}
                type="button"
                role="tab"
                aria-selected={search.status === item.value}
                className={search.status === item.value ? "is-active" : undefined}
                onClick={() => go({ status: item.value })}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="ws-seg" role="tablist" aria-label="Source">
            {[
              { value: undefined, label: "All sources" },
              { value: "catalog", label: "Catalog" },
              { value: "checker", label: "Health Checker" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                role="tab"
                aria-selected={search.source === item.value}
                className={search.source === item.value ? "is-active" : undefined}
                onClick={() => go({ source: item.value })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <form
          className="ws-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: q.trim() || undefined });
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or clinic" aria-label="Search requests" />
          <button type="submit" className="ws-pill is-ink">
            Search
          </button>
        </form>
      </div>

      {leads.isLoading ? <WsLoading label="Loading requests…" inline /> : null}
      {leads.isError ? <WsNote tone="danger" title="Could not load the requests" /> : null}
      {!leads.isLoading && leads.data?.length === 0 ? (
        <div className="ws-empty">
          <span className="ws-empty-mark">
            <img src="/brand/logo.svg" alt="" width={40} height={40} />
          </span>
          <h2>No requests</h2>
          <p>Nothing matches these filters. Reset the filters or change the search.</p>
        </div>
      ) : null}

      {leads.data?.length ? (
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Clinic</th>
                <th>Source</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.data.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link to="/moderation/leads/$id" params={{ id: lead.id }}>
                      {lead.fullName}
                    </Link>
                    <small>{lead.phone}</small>
                  </td>
                  <td>{lead.clinic?.nameRu || lead.clinic?.nameEn || "—"}</td>
                  <td>{lead.source === "checker" ? "Health Checker" : "Catalog"}</td>
                  <td>
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="whitespace-nowrap text-muted">{new Date(lead.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
