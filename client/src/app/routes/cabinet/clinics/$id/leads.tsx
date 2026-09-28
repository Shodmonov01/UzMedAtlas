import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  cabinetMe,
  fetchCabinetClinic,
  fetchCabinetLeads,
  updateCabinetLead,
} from "@/shared/api/cabinet";

export const Route = createFileRoute("/cabinet/clinics/$id/leads")({
  component: CabinetLeadsPage,
});

const STATUS_OPTIONS = [
  { value: "", label: "Все" },
  { value: "new", label: "Новые" },
  { value: "contacted", label: "На связи" },
  { value: "closed", label: "Закрыты" },
];

function CabinetLeadsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", id],
    queryFn: () => fetchCabinetClinic(id),
    enabled: auth.data === true,
  });
  const leads = useQuery({
    queryKey: ["cabinet-leads", id, status],
    queryFn: () => fetchCabinetLeads(id, status || undefined),
    enabled: auth.data === true,
  });

  const patch = useMutation({
    mutationFn: (payload: { leadId: string; status?: string; notes?: string | null }) =>
      updateCabinetLead(id, payload.leadId, { status: payload.status, notes: payload.notes }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cabinet-leads", id] });
    },
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/cabinet/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (auth.isLoading || !auth.data) {
    return <p className="text-muted">Проверка сессии…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/cabinet/clinics/$id" params={{ id }} className="text-sm font-semibold text-muted">
          ← {clinic.data?.nameRu || clinic.data?.nameEn || "Клиника"}
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">Заявки</h1>
        <p className="mt-1 text-muted">Обращения пациентов с каталога и Health Checker</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value || "all"}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-bold ${
              status === opt.value ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-line"
            }`}
            onClick={() => setStatus(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {leads.isLoading ? <p className="text-muted">Загрузка…</p> : null}
      {!leads.isLoading && leads.data?.length === 0 ? (
        <p className="text-muted">Заявок пока нет</p>
      ) : null}

      <div className="space-y-4">
        {leads.data?.map((lead) => (
          <article key={lead.id} className="soft-card space-y-3 rounded-[1.5rem] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">{lead.fullName}</h2>
                <p className="text-sm text-muted">
                  {lead.country} · {lead.phone}
                  {lead.email ? ` · ${lead.email}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-sand px-2 py-1">
                  {lead.source === "checker" ? "Health Checker" : "Каталог"}
                </span>
                <span
                  className={`rounded-full px-2 py-1 ${
                    lead.status === "new"
                      ? "bg-primary-soft text-primary"
                      : lead.status === "contacted"
                        ? "bg-mint text-primary"
                        : "bg-sand text-muted"
                  }`}
                >
                  {lead.status}
                </span>
              </div>
            </div>

            {lead.recommendedSpecialty ? (
              <p className="text-sm">
                Направление:{" "}
                <strong>{lead.recommendedSpecialty.nameRu || lead.recommendedSpecialty.nameEn}</strong>
              </p>
            ) : null}
            {(lead.symptoms || lead.medicalNeed) && (
              <p className="rounded-xl bg-sand px-3 py-2 text-sm text-muted">
                {lead.symptoms || lead.medicalNeed}
              </p>
            )}
            <p className="text-xs text-muted">
              {new Date(lead.createdAt).toLocaleString("ru-RU")} · {lead.contactMethod}
              {lead.age != null ? ` · ${lead.age} лет` : ""}
            </p>

            <div className="flex flex-wrap gap-2">
              {(["new", "contacted", "closed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="btn btn-ghost px-3 py-1.5 text-xs"
                  disabled={patch.isPending || lead.status === s}
                  onClick={() => patch.mutate({ leadId: lead.id, status: s })}
                >
                  {s}
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold">
              Заметки
              <textarea
                className="field mt-1"
                rows={2}
                value={notesDraft[lead.id] ?? lead.notes ?? ""}
                onChange={(e) => setNotesDraft((prev) => ({ ...prev, [lead.id]: e.target.value }))}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary px-4 py-2 text-sm"
              disabled={patch.isPending}
              onClick={() =>
                patch.mutate({
                  leadId: lead.id,
                  notes: notesDraft[lead.id] ?? lead.notes ?? "",
                })
              }
            >
              Сохранить заметки
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
