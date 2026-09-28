import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { cabinetMe, createCabinetClinic } from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { ClinicEditorForm } from "@/widgets/clinic-form/ClinicEditorForm";

export const Route = createFileRoute("/cabinet/clinics/new")({
  component: NewClinicPage,
});

function NewClinicPage() {
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
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Новая клиника</h1>
      <p className="text-muted">Данные сохраняются как черновик. Потом можно отправить на модерацию.</p>
      {specialties.isLoading ? <p className="text-muted">Загрузка направлений…</p> : null}
      {specialties.data ? (
        <ClinicEditorForm
          specialties={specialties.data}
          onSubmit={async (payload) => {
            const created = await createCabinetClinic(payload);
            void navigate({ to: "/cabinet/clinics/$id", params: { id: created.id } });
          }}
        />
      ) : null}
    </div>
  );
}
