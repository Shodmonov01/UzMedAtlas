import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { cabinetMe, createCabinetBranch, fetchCabinetClinic } from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { BranchEditorForm } from "@/widgets/clinic-form/BranchEditorForm";

export const Route = createFileRoute("/cabinet/clinics/$id/branches/new")({
  component: NewBranchPage,
});

function NewBranchPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
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
    if (auth.isError || auth.data === false) void navigate({ to: "/cabinet/login" });
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data || clinic.isLoading) return <p className="text-muted">Загрузка…</p>;
  if (!clinic.data) return <p className="text-danger">Клиника не найдена</p>;
  if (clinic.data.status === "moderation") {
    return <p className="text-muted">На модерации нельзя добавлять филиалы.</p>;
  }

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
        <h1 className="mt-2 text-3xl font-extrabold">Новый филиал</h1>
      </div>
      {specialties.data ? (
        <BranchEditorForm
          specialties={specialties.data}
          allowedSpecialtyIds={clinic.data.specialtyIds}
          initial={{
            city: clinic.data.city,
            phone: clinic.data.phone,
            email: clinic.data.email,
            addressRu: clinic.data.addressRu,
            addressEn: clinic.data.addressEn,
            specialtyIds: clinic.data.specialtyIds,
          }}
          onSubmit={async (payload) => {
            const created = await createCabinetBranch(id, payload);
            void navigate({
              to: "/cabinet/clinics/$id/branches/$branchId",
              params: { id, branchId: created.id },
            });
          }}
        />
      ) : null}
    </div>
  );
}
