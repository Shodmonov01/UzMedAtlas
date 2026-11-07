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
  { value: undefined, label: "Все" },
  { value: "new", label: "Новые" },
  { value: "contacted", label: "На связи" },
  { value: "closed", label: "Закрыты" },
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

  if (auth.isLoading || !auth.data) return <WsLoading label="Проверка сессии…" />;

  const go = (next: Partial<typeof search>) => void navigate({ to: "/moderation/leads", search: { ...search, ...next } });

  return (
    <div className="ws-stack">
      <PageHead
        eyebrow="Модерация"
        title="Заявки пациентов"
        lead="Все обращения со страниц клиник и из Health Checker. Клиника видит свои заявки в кабинете; здесь — общий список."
      />

      <div className="ws-toolbar">
        <div className="flex flex-wrap gap-2">
          <div className="ws-seg" role="tablist" aria-label="Статус">
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
          <div className="ws-seg" role="tablist" aria-label="Источник">
            {[
              { value: undefined, label: "Все источники" },
              { value: "catalog", label: "Каталог" },
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
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, телефон или клиника" aria-label="Поиск заявок" />
          <button type="submit" className="ws-pill is-ink">
            Найти
          </button>
        </form>
      </div>

      {leads.isLoading ? <WsLoading label="Загружаем заявки…" inline /> : null}
      {leads.isError ? <WsNote tone="danger" title="Не удалось загрузить заявки" /> : null}
      {!leads.isLoading && leads.data?.length === 0 ? (
        <div className="ws-empty">
          <span className="ws-empty-mark">
            <img src="/brand/logo.svg" alt="" width={40} height={40} />
          </span>
          <h2>Заявок нет</h2>
          <p>По этим фильтрам ничего не нашлось. Сбросьте фильтры или измените запрос.</p>
        </div>
      ) : null}

      {leads.data?.length ? (
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Пациент</th>
                <th>Клиника</th>
                <th>Источник</th>
                <th>Статус</th>
                <th>Дата</th>
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
                  <td>{lead.source === "checker" ? "Health Checker" : "Каталог"}</td>
                  <td>
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="whitespace-nowrap text-muted">{new Date(lead.createdAt).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
