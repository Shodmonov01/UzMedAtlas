import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  addBranchPhoto,
  cabinetMe,
  deleteBranchPhoto,
  fetchCabinetBranch,
  fetchCabinetClinic,
  updateCabinetBranch,
  uploadCabinetFile,
} from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { yandexPointUrl } from "@/shared/lib/yandex-maps";
import { BranchDoctorsPanel } from "@/widgets/clinic-form/BranchDoctorsPanel";
import { BranchEditorForm } from "@/widgets/clinic-form/BranchEditorForm";
import { BranchServicesPanel } from "@/widgets/clinic-form/BranchServicesPanel";

export const Route = createFileRoute("/cabinet/clinics/$id/branches/$branchId")({
  component: EditBranchPage,
});

function EditBranchPage() {
  const { id, branchId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", id],
    queryFn: () => fetchCabinetClinic(id),
    enabled: auth.data === true,
  });
  const branch = useQuery({
    queryKey: ["cabinet-branch", id, branchId],
    queryFn: () => fetchCabinetBranch(id, branchId),
    enabled: auth.data === true,
  });
  const specialties = useQuery({
    queryKey: ["specialties"],
    queryFn: fetchSpecialties,
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) void navigate({ to: "/cabinet/login" });
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data || clinic.isLoading || branch.isLoading) {
    return <p className="text-muted">Загрузка…</p>;
  }
  if (!clinic.data || !branch.data) return <p className="text-danger">Не найдено</p>;

  const locked = clinic.data.status === "moderation";

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/cabinet/clinics/$id/branches"
          params={{ id }}
          className="text-sm font-bold text-primary"
        >
          ← Филиалы
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">
          {branch.data.nameRu || branch.data.nameEn}
        </h1>
      </div>

      {message ? <p className="text-sm font-bold text-primary">{message}</p> : null}

      {specialties.data ? (
        <BranchEditorForm
          key={branch.data.id}
          specialties={specialties.data}
          allowedSpecialtyIds={clinic.data.specialtyIds}
          initial={branch.data}
          locked={locked}
          onSubmit={async (payload) => {
            await updateCabinetBranch(id, branchId, payload);
            await qc.invalidateQueries({ queryKey: ["cabinet-branch", id, branchId] });
            await qc.invalidateQueries({ queryKey: ["cabinet-branches", id] });
            await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
            setMessage("Филиал сохранён");
            await branch.refetch();
          }}
        />
      ) : null}

      <BranchServicesPanel
        clinicId={id}
        branchId={branchId}
        services={branch.data.services || []}
        specialties={(branch.data.specialties || []).map((s) => ({
          id: s.id,
          nameRu: s.nameRu,
          nameEn: s.nameEn,
        }))}
        locked={locked}
        onChanged={async () => {
          await branch.refetch();
          await qc.invalidateQueries({ queryKey: ["cabinet-branches", id] });
          await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
        }}
      />

      <BranchDoctorsPanel
        clinicId={id}
        branchId={branchId}
        clinicDoctors={clinic.data.doctors || []}
        branchDoctorIds={(branch.data.doctors || []).map((d) => d.id)}
        specialtyIds={branch.data.specialtyIds || []}
        locked={locked}
        onChanged={async () => {
          await branch.refetch();
          await clinic.refetch();
          await qc.invalidateQueries({ queryKey: ["cabinet-branches", id] });
        }}
      />

      <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
        <h2 className="text-xl font-extrabold">Фото филиала</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(branch.data.photos || []).map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-xl border border-line">
              <img src={photo.url} alt="" className="aspect-video w-full object-cover" />
              {!locked ? (
                <button
                  type="button"
                  className="w-full p-2 text-xs font-bold text-danger"
                  onClick={async () => {
                    await deleteBranchPhoto(id, branchId, photo.id);
                    await branch.refetch();
                  }}
                >
                  Удалить
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {!locked ? (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement)
                ?.files?.[0];
              if (!file) return;
              const url = await uploadCabinetFile(file);
              await addBranchPhoto(id, branchId, { url, category: "facade" });
              e.currentTarget.reset();
              await branch.refetch();
              setMessage("Фото добавлено");
            }}
          >
            <input name="file" type="file" accept="image/*" required className="field" />
            <button className="btn btn-primary text-sm" type="submit">
              Загрузить фото
            </button>
          </form>
        ) : null}

        {branch.data.lat != null && branch.data.lng != null ? (
          <p className="text-sm text-muted">
            Карта:{" "}
            <a
              className="font-bold text-primary"
              href={yandexPointUrl(branch.data.lat, branch.data.lng)}
              target="_blank"
              rel="noreferrer"
            >
              Яндекс.Карты ({branch.data.lat}, {branch.data.lng})
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
