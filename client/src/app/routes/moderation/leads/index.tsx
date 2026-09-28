import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminLogout, adminMe, fetchAdminLeads } from "@/shared/api/cabinet";

export const Route = createFileRoute("/moderation/leads/")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : undefined,
    source: typeof search.source === "string" ? search.source : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: AdminLeadsPage,
});

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

  if (auth.isLoading || !auth.data) {
    return <p className="text-muted">Проверка сессии…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/moderation" className="text-sm font-semibold text-muted">
            ← Очередь модерации
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">Заявки пациентов</h1>
        </div>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={async () => {
            await adminLogout();
            void navigate({ to: "/moderation/login" });
          }}
        >
          Выйти
        </button>
      </div>

      <form
        className="flex flex-wrap gap-3 rounded-[1.5rem] border border-line bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          void navigate({
            to: "/moderation/leads",
            search: {
              q: String(fd.get("q") || "") || undefined,
              status: String(fd.get("status") || "") || undefined,
              source: String(fd.get("source") || "") || undefined,
            },
          });
        }}
      >
        <input
          name="q"
          className="field w-full max-w-xs"
          placeholder="Поиск…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select name="status" className="field w-auto" defaultValue={search.status || ""}>
          <option value="">Все статусы</option>
          <option value="new">new</option>
          <option value="contacted">contacted</option>
          <option value="closed">closed</option>
        </select>
        <select name="source" className="field w-auto" defaultValue={search.source || ""}>
          <option value="">Все источники</option>
          <option value="checker">Health Checker</option>
          <option value="catalog">Каталог</option>
        </select>
        <button className="btn btn-primary text-sm" type="submit">
          Фильтр
        </button>
      </form>

      {leads.isLoading ? <p className="text-muted">Загрузка…</p> : null}
      {!leads.isLoading && leads.data?.length === 0 ? (
        <p className="text-muted">Заявок нет</p>
      ) : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th className="px-4 py-3">Пациент</th>
              <th className="px-4 py-3">Клиника</th>
              <th className="px-4 py-3">Источник</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дата</th>
            </tr>
          </thead>
          <tbody>
            {leads.data?.map((lead) => (
              <tr key={lead.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link
                    to="/moderation/leads/$id"
                    params={{ id: lead.id }}
                    className="font-semibold text-primary"
                  >
                    {lead.fullName}
                  </Link>
                  <div className="text-muted">{lead.phone}</div>
                </td>
                <td className="px-4 py-3">{lead.clinic?.nameRu || lead.clinic?.nameEn}</td>
                <td className="px-4 py-3">
                  {lead.source === "checker" ? "Health Checker" : "Каталог"}
                </td>
                <td className="px-4 py-3">{lead.status}</td>
                <td className="px-4 py-3">{new Date(lead.createdAt).toLocaleString("ru-RU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
