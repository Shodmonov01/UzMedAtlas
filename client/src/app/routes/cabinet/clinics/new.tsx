import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BriefUpload } from "@/widgets/clinic-form/BriefUpload";
import { cabinetMe, createCabinetClinic } from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { ClinicEditorForm } from "@/widgets/clinic-form/ClinicEditorForm";

export const Route = createFileRoute("/cabinet/clinics/new")({
  component: NewClinicPage,
});

function NewClinicPage() {
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [briefVersion, setBriefVersion] = useState(0);
  const editor = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
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

  if (!auth.data) return <p className="text-muted">Проверка сессии…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link to="/cabinet" className="text-sm font-bold text-primary hover:underline">
          Мои клиники
        </Link>

        <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_24px_60px_-36px_rgba(31,41,55,0.35)]">
          <div className="bg-primary-soft px-6 py-8 text-ink md:px-8">
            <p className="text-sm font-semibold text-muted">Кабинет клиники</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-primary-deep md:text-4xl">Создание клиники</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              Заполните профиль по шагам. После создания откроется редактор, где можно добавить филиалы,
              фотографии и остальные сведения.
            </p>
          </div>
        </div>
      </div>

      {specialties.isLoading ? <p className="text-muted">Загрузка направлений…</p> : null}
      {specialties.isError ? <p className="text-danger">Не удалось загрузить направления</p> : null}
      <BriefUpload onApply={fields => {
        const form = editor.current?.querySelector("form");
        const current = form ? Object.fromEntries(Array.from(new FormData(form).entries()).filter((entry): entry is [string, string] => typeof entry[1] === "string")) : {};
        setBrief(previous => ({ ...previous, ...current, ...fields }));
        setBriefVersion(v => v + 1);
      }} />
      <div ref={editor}>
      {specialties.data ? (
        <ClinicEditorForm
          key={briefVersion}
          initial={brief}
          specialties={specialties.data}
          onSubmit={async (payload) => {
            const created = await createCabinetClinic(payload);
            void navigate({ to: "/cabinet/clinics/$id", params: { id: created.id } });
          }}
        />
      ) : null}
      </div>
    </div>
  );
}
