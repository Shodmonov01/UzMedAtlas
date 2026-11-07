import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { cabinetMe, createCabinetBranch, fetchCabinetClinic, uploadCabinetFile } from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { BranchEditorForm } from "@/widgets/clinic-form/BranchEditorForm";
import { BackMark, PageHead, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

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

  if (!auth.data || clinic.isLoading) return <WsLoading />;
  if (!clinic.data) return <WsNote tone="danger" title="Клиника не найдена" />;
  if (clinic.data.status === "moderation") {
    return <WsNote tone="info" title="Клиника на модерации">На модерации нельзя добавлять филиалы.</WsNote>;
  }

  return (
    <div className="ws-stack">
      <PageHead
        back={
          <Link to="/cabinet/clinics/$id/branches" params={{ id }} className="ws-back">
            <BackMark />
            Филиалы · {clinic.data.nameRu || clinic.data.nameEn}
          </Link>
        }
        eyebrow="Новый филиал"
        title="Добавить филиал"
        lead="Адрес, телефон и направления подставлены из профиля клиники — поправьте их под этот филиал. Услуги, врачи и фото добавите после сохранения."
      />
      {specialties.data ? (
        <BranchEditorForm
          specialties={specialties.data}
          allowedSpecialtyIds={clinic.data.specialtyIds}
          onUpload={uploadCabinetFile}
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
              search: { section: undefined },
            });
          }}
        />
      ) : null}
    </div>
  );
}
