import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  cabinetMe,
  deleteCabinetClinic,
  fetchCabinetClinic,
  submitCabinetClinic,
  type WizardSectionId,
} from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { ClinicWizard } from "@/widgets/clinic-form/ClinicWizard";
import axios from "axios";

export const Route = createFileRoute("/cabinet/clinics/$id/")({
  component: EditClinicPage,
});

function EditClinicPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<{ field: string; message: string }[]>([]);
  const [jumpSection, setJumpSection] = useState<WizardSectionId | undefined>();

  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", id],
    queryFn: () => fetchCabinetClinic(id),
    enabled: auth.data === true,
  });
  const specialties = useQuery({
    queryKey: ["specialties"],
    queryFn: fetchSpecialties,
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/cabinet/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data || clinic.isLoading) return <p className="text-muted">Загрузка…</p>;
  if (!clinic.data) return <p className="text-danger">Клиника не найдена</p>;

  const locked = clinic.data.status === "moderation";
  const canSubmit = clinic.data.status === "draft" || clinic.data.status === "needs_changes";
  const canDelete = clinic.data.status === "draft" || clinic.data.status === "needs_changes";

  function sectionForField(field: string): WizardSectionId {
    if (field.startsWith("branches.")) return "branches";
    if (field === "logo") return "basic";
    if (field === "specialties") return "directions";
    if (field === "phone" || field === "email" || field === "address") return "contacts";
    if (field === "description") return "about";
    if (field === "name") return "basic";
    return "preview";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/cabinet" className="text-sm font-bold text-primary">
            ← Мои клиники
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">{clinic.data.nameRu || clinic.data.nameEn}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={clinic.data.status} />
            <span className="text-xs text-muted">
              Филиалов: {clinic.data.branchCount ?? 0} · Врачей: {clinic.data.doctorCount ?? 0}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/cabinet/clinics/$id/branches"
            params={{ id }}
            className="btn btn-ghost text-sm"
          >
            Филиалы ({clinic.data.branchCount ?? 0})
          </Link>
          {canSubmit ? (
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={async () => {
                setMessage(null);
                setIssues([]);
                try {
                  if (
                    !window.confirm(
                      "После отправки данные будут переданы на проверку модератору. Продолжить?",
                    )
                  ) {
                    return;
                  }
                  await submitCabinetClinic(id);
                  await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
                  await qc.invalidateQueries({ queryKey: ["cabinet-clinics"] });
                  setMessage("Отправлено на модерацию");
                } catch (err) {
                  if (axios.isAxiosError(err) && err.response?.data?.issues) {
                    setIssues(err.response.data.issues as { field: string; message: string }[]);
                  } else {
                    setMessage("Не удалось отправить");
                  }
                }
              }}
            >
              Отправить на модерацию
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="btn btn-ghost text-sm"
              onClick={async () => {
                if (!window.confirm("Удалить клинику?")) return;
                await deleteCabinetClinic(id);
                void navigate({ to: "/cabinet" });
              }}
            >
              Удалить
            </button>
          ) : null}
        </div>
      </div>

      {clinic.data.moderatorNote ? (
        <div className="rounded-[1.25rem] bg-danger-soft p-4 text-sm text-danger">
          <p className="font-bold">Комментарий модератора</p>
          <p className="mt-1">{clinic.data.moderatorNote}</p>
        </div>
      ) : null}

      {message ? <p className="text-sm font-bold text-primary">{message}</p> : null}
      {issues.length ? (
        <div className="rounded-[1.25rem] bg-warning-soft p-4 text-sm">
          <p className="font-bold">Необходимо заполнить:</p>
          <ul className="mt-2 space-y-1">
            {issues.map((item) => (
              <li key={item.field + item.message}>
                {item.field.startsWith("branches.") ? (
                  (() => {
                    const [, branchId, field] = item.field.split(".");
                    const section = field === "phone" ? "contacts" : field === "specialties" ? "directions" : field === "address" || field === "city" ? "address" : "basic";
                    return branchId && clinic.data.branches?.some((branch) => branch.id === branchId) ? (
                      <Link
                        to="/cabinet/clinics/$id/branches/$branchId"
                        params={{ id, branchId }}
                        search={{ section }}
                        className="font-semibold text-primary underline"
                      >
                        {item.message}
                      </Link>
                    ) : (
                      <Link to="/cabinet/clinics/$id/branches" params={{ id }} className="font-semibold text-primary underline">{item.message}</Link>
                    );
                  })()
                ) : (
                  <button
                    type="button"
                    className="font-semibold text-primary underline"
                    onClick={() => setJumpSection(sectionForField(item.field))}
                  >
                    {item.message}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {locked ? (
        <p className="text-sm text-muted">Клиника на модерации — редактирование недоступно.</p>
      ) : null}

      {specialties.data ? (
        <ClinicWizard
          key={jumpSection ? `${id}-jump-${jumpSection}` : id}
          clinic={clinic.data}
          specialties={specialties.data}
          locked={locked}
          initialSection={jumpSection}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
            await qc.invalidateQueries({ queryKey: ["cabinet-clinics"] });
            await clinic.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
