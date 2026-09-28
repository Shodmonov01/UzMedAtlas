import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  addBranchPhoto,
  cabinetMe,
  deleteBranchPhoto,
  fetchCabinetBranch,
  fetchCabinetClinic,
  reorderBranchPhotos,
  replaceBranchPhoto,
  setBranchMainPhoto,
  updateCabinetBranch,
  uploadCabinetFile,
} from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { yandexPointUrl } from "@/shared/lib/yandex-maps";
import { BranchDoctorsPanel } from "@/widgets/clinic-form/BranchDoctorsPanel";
import {
  BRANCH_CORE_SECTIONS,
  BranchEditorForm,
  type BranchCoreSectionId,
} from "@/widgets/clinic-form/BranchEditorForm";
import { BranchEquipmentPanel } from "@/widgets/clinic-form/BranchEquipmentPanel";
import { BranchServicesPanel } from "@/widgets/clinic-form/BranchServicesPanel";

export const Route = createFileRoute("/cabinet/clinics/$id/branches/$branchId")({
  validateSearch: (search: Record<string, unknown>) => ({
    section: typeof search.section === "string" ? search.section : undefined,
  }),
  component: EditBranchPage,
});

const BRANCH_PAGE_SECTIONS = [
  ...BRANCH_CORE_SECTIONS,
  { id: "services", label: "Услуги" },
  { id: "doctors", label: "Специалисты" },
  { id: "photos", label: "Фото" },
  { id: "equipment", label: "Оборудование" },
] as const;

type BranchPageSectionId = (typeof BRANCH_PAGE_SECTIONS)[number]["id"];

const CORE_IDS = new Set<string>(BRANCH_CORE_SECTIONS.map((s) => s.id));

function EditBranchPage() {
  const { id, branchId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [section, setSection] = useState<BranchPageSectionId>(
    BRANCH_PAGE_SECTIONS.some((item) => item.id === search.section)
      ? (search.section as BranchPageSectionId)
      : "basic",
  );

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

  function goNextPageSection() {
    const i = BRANCH_PAGE_SECTIONS.findIndex((s) => s.id === section);
    if (i >= 0 && i < BRANCH_PAGE_SECTIONS.length - 1) {
      setSection(BRANCH_PAGE_SECTIONS[i + 1].id);
      setMessage(null);
    }
  }

  if (!auth.data || clinic.isLoading || branch.isLoading) {
    return <p className="text-muted">Загрузка…</p>;
  }
  if (!clinic.data || !branch.data) return <p className="text-danger">Не найдено</p>;

  const locked = clinic.data.status === "moderation";
  const isCore = CORE_IDS.has(section);

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

      <nav className="soft-card flex flex-wrap gap-1 rounded-[1.5rem] bg-white p-2">
        {BRANCH_PAGE_SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-xl px-3 py-2 text-sm font-bold ${
              section === item.id ? "bg-lime text-primary-deep" : "text-muted hover:bg-mint"
            }`}
            onClick={() => {
              setSection(item.id);
              setMessage(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {isCore && specialties.data ? (
        <BranchEditorForm
          key={branch.data.id}
          specialties={specialties.data}
          allowedSpecialtyIds={clinic.data.specialtyIds}
          onUpload={uploadCabinetFile}
          initial={branch.data}
          locked={locked}
          hideNav
          activeSection={section as BranchCoreSectionId}
          onActiveSectionChange={(id) => setSection(id)}
          onContinuePastEnd={() => setSection("services")}
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

      {section === "services" ? (
        <div className="space-y-4">
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
          {!locked ? (
            <button type="button" className="btn btn-ghost text-sm" onClick={goNextPageSection}>
              Сохранить и продолжить
            </button>
          ) : null}
        </div>
      ) : null}

      {section === "doctors" ? (
        <div className="space-y-4">
          <BranchDoctorsPanel
            clinicId={id}
            branchId={branchId}
            clinicDoctors={clinic.data.doctors || []}
            branchDoctorIds={(branch.data.doctors || []).map((d) => d.id)}
            specialtyIds={branch.data.specialtyIds || []}
            specialtyOptions={clinic.data.specialties || []}
            onUpload={uploadCabinetFile}
            locked={locked}
            onChanged={async () => {
              await branch.refetch();
              await clinic.refetch();
              await qc.invalidateQueries({ queryKey: ["cabinet-branches", id] });
            }}
          />
          {!locked ? (
            <button type="button" className="btn btn-ghost text-sm" onClick={goNextPageSection}>
              Сохранить и продолжить
            </button>
          ) : null}
        </div>
      ) : null}

      {section === "photos" ? (
        <div className="space-y-4">
          <div className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6">
            <h2 className="text-xl font-extrabold">Фото филиала</h2>
            <p className="text-sm text-muted">Первое фото — главное. Меняйте порядок или назначьте главную.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(branch.data.photos || []).map((photo, index) => (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-line">
                  <div className="relative">
                    <img src={photo.url} alt="" className="aspect-video w-full object-cover" />
                    {index === 0 ? (
                      <span className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                        Главная
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2 p-2 text-xs">
                    <p className="font-bold text-muted">{photo.category}</p>
                    {!locked ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded-lg border border-line px-2 py-1 font-bold disabled:opacity-40"
                          disabled={index === 0}
                          onClick={async () => {
                            const ids = (branch.data.photos || []).map((p) => p.id);
                            const next = [...ids];
                            [next[index - 1], next[index]] = [next[index], next[index - 1]];
                            await reorderBranchPhotos(id, branchId, next);
                            await branch.refetch();
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-line px-2 py-1 font-bold disabled:opacity-40"
                          disabled={index >= (branch.data.photos?.length || 0) - 1}
                          onClick={async () => {
                            const ids = (branch.data.photos || []).map((p) => p.id);
                            const next = [...ids];
                            [next[index], next[index + 1]] = [next[index + 1], next[index]];
                            await reorderBranchPhotos(id, branchId, next);
                            await branch.refetch();
                          }}
                        >
                          ↓
                        </button>
                        {index !== 0 ? (
                          <button
                            type="button"
                            className="rounded-lg border border-line px-2 py-1 font-bold text-primary"
                            onClick={async () => {
                              await setBranchMainPhoto(id, branchId, photo.id);
                              await branch.refetch();
                            }}
                          >
                            Главная
                          </button>
                        ) : null}
                        <label className="cursor-pointer rounded-lg border border-line px-2 py-1 font-bold text-primary">
                          Заменить
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const url = await uploadCabinetFile(file);
                              await replaceBranchPhoto(id, branchId, photo.id, { url });
                              await branch.refetch();
                              setMessage("Фото заменено");
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="rounded-lg border border-line px-2 py-1 font-bold text-danger"
                          onClick={async () => {
                            await deleteBranchPhoto(id, branchId, photo.id);
                            await branch.refetch();
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {!locked ? (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement)
                    ?.files?.[0];
                  if (!file) return;
                  const url = await uploadCabinetFile(file);
                  await addBranchPhoto(id, branchId, {
                    url,
                    category: String(fd.get("category") || "facade"),
                  });
                  e.currentTarget.reset();
                  await branch.refetch();
                  setMessage("Фото добавлено");
                }}
              >
                <select name="category" className="field" defaultValue="facade">
                  <option value="facade">Фасад</option>
                  <option value="reception">Ресепшен</option>
                  <option value="hall">Холл</option>
                  <option value="rooms">Кабинеты</option>
                  <option value="or">Операционная</option>
                  <option value="equipment">Оборудование</option>
                  <option value="staff">Сотрудники</option>
                  <option value="other">Другое</option>
                </select>
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
          {!locked ? (
            <button type="button" className="btn btn-ghost text-sm" onClick={goNextPageSection}>
              Сохранить и продолжить
            </button>
          ) : null}
        </div>
      ) : null}

      {section === "equipment" ? (
        <BranchEquipmentPanel
          clinicId={id}
          branchId={branchId}
          equipment={branch.data.equipment || []}
          locked={locked}
          onChanged={async () => {
            await branch.refetch();
            await qc.invalidateQueries({ queryKey: ["cabinet-clinic", id] });
          }}
        />
      ) : null}
    </div>
  );
}
