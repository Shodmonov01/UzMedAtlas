import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminMe, fetchAdminLead, updateAdminLead } from "@/shared/api/cabinet";

export const Route = createFileRoute("/moderation/leads/$id")({
  component: AdminLeadDetailPage,
});

function AdminLeadDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const auth = useQuery({ queryKey: ["admin-me"], queryFn: adminMe, retry: false });
  const lead = useQuery({
    queryKey: ["admin-lead", id],
    queryFn: () => fetchAdminLead(id),
    enabled: auth.data === true,
  });

  const patch = useMutation({
    mutationFn: (payload: { status?: string; notes?: string | null }) => updateAdminLead(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-lead", id] });
      void qc.invalidateQueries({ queryKey: ["admin-leads"] });
    },
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/moderation/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  useEffect(() => {
    if (lead.data) setNotes(lead.data.notes || "");
  }, [lead.data]);

  if (auth.isLoading || !auth.data) {
    return <p className="text-muted">Проверка сессии…</p>;
  }
  if (lead.isLoading) return <p className="text-muted">Загрузка…</p>;
  if (lead.isError || !lead.data) {
    return (
      <div>
        <p className="text-danger">Заявка не найдена</p>
        <Link to="/moderation/leads" search={{ status: undefined, source: undefined, q: undefined }} className="mt-4 inline-block font-bold text-primary">
          ← К списку
        </Link>
      </div>
    );
  }

  const data = lead.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/moderation/leads" search={{ status: undefined, source: undefined, q: undefined }} className="text-sm font-semibold text-muted">
          ← Все заявки
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">{data.fullName}</h1>
        <p className="mt-1 text-muted">
          {data.clinic?.nameRu || data.clinic?.nameEn} ·{" "}
          {data.source === "checker" ? "Health Checker" : "Каталог"}
        </p>
      </div>

      <dl className="grid gap-3 rounded-[1.5rem] border border-line bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Телефон</dt>
          <dd className="font-bold">{data.phone}</dd>
        </div>
        <div>
          <dt className="text-muted">Страна</dt>
          <dd className="font-bold">{data.country}</dd>
        </div>
        <div>
          <dt className="text-muted">Email</dt>
          <dd className="font-bold">{data.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Связь</dt>
          <dd className="font-bold">{data.contactMethod}</dd>
        </div>
        <div>
          <dt className="text-muted">Статус</dt>
          <dd className="font-bold">{data.status}</dd>
        </div>
        <div>
          <dt className="text-muted">Возраст</dt>
          <dd className="font-bold">{data.age ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Направление</dt>
          <dd className="font-bold">
            {data.recommendedSpecialty?.nameRu ||
              data.recommendedSpecialty?.nameEn ||
              "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Запрос</dt>
          <dd className="mt-1 whitespace-pre-wrap">{data.symptoms || data.medicalNeed || "—"}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {(["new", "contacted", "closed"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn-ghost px-4 py-2 text-sm"
            disabled={patch.isPending || data.status === s}
            onClick={() => patch.mutate({ status: s })}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="block text-sm font-bold">
        Заметки модератора
        <textarea
          className="field mt-1"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="btn btn-primary"
        disabled={patch.isPending}
        onClick={() => patch.mutate({ notes })}
      >
        Сохранить
      </button>
    </div>
  );
}
