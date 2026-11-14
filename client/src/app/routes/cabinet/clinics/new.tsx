import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BriefUpload } from "@/widgets/clinic-form/BriefUpload";
import { cabinetMe, createCabinetClinic } from "@/shared/api/cabinet";
import { fetchSpecialties } from "@/shared/api/client";
import { ClinicEditorForm } from "@/widgets/clinic-form/ClinicEditorForm";
import { BackMark, PageHead, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

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

  if (!auth.data) return <WsLoading label="Checking your session…" />;

  return (
    <div className="ws-stack mx-auto w-full max-w-4xl">
      <PageHead
        back={
          <Link to="/cabinet" className="ws-back">
            <BackMark />
            My clinics
          </Link>
        }
        eyebrow="New clinic"
        title="Create a clinic"
        lead="Five short steps: name, address, contacts, description and specialties. After that the editor opens, where you add branches, photos and doctors."
      />

      {specialties.isLoading ? <WsLoading label="Loading specialties…" inline /> : null}
      {specialties.isError ? <WsNote tone="danger" title="Could not load the specialties" /> : null}
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
