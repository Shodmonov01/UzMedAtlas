import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  cabinetMe,
  deleteCabinetBranch,
  fetchCabinetBranches,
  fetchCabinetClinic,
} from "@/shared/api/cabinet";
import { CITY_LABELS } from "@/shared/api/client";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { BackMark, PageHead, WsIcon, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/cabinet/clinics/$id/branches/")({
  component: BranchesListPage,
});

function BranchesListPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const auth = useQuery({ queryKey: ["cabinet-me"], queryFn: cabinetMe, retry: false });
  const clinic = useQuery({
    queryKey: ["cabinet-clinic", id],
    queryFn: () => fetchCabinetClinic(id),
    enabled: auth.data === true,
  });
  const branches = useQuery({
    queryKey: ["cabinet-branches", id],
    queryFn: () => fetchCabinetBranches(id),
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) void navigate({ to: "/cabinet/login" });
  }, [auth.data, auth.isError, navigate]);

  if (!auth.data || clinic.isLoading) return <WsLoading />;
  if (!clinic.data) return <WsNote tone="danger" title="Clinic not found" />;

  const locked = clinic.data.status === "moderation";
  const list = (branches.data || []).filter(Boolean);

  return (
    <div className="ws-stack">
      <PageHead
        back={
          <Link to="/cabinet/clinics/$id" params={{ id }} className="ws-back">
            <BackMark />
            {clinic.data.nameRu || clinic.data.nameEn}
          </Link>
        }
        eyebrow="Branches"
        title="Clinic branches"
        lead="Review needs at least one branch with an address and a phone. Each branch has its own page in the catalog."
        actions={
          !locked ? (
            <Link to="/cabinet/clinics/$id/branches/new" params={{ id }} className="pill-btn is-ink">
              Add a branch
              <span className="pill-btn-icon">
                <WsIcon name="plus" size={18} />
              </span>
            </Link>
          ) : undefined
        }
      />

      {branches.isLoading ? <WsLoading label="Loading branches…" inline /> : null}
      {branches.isError ? <WsNote tone="danger" title="Could not load the branches" /> : null}

      {list.length ? (
        <div className="ws-rows">
          {list.map((branch) => (
            <article key={branch!.id} className="ws-row">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper text-ink">
                <WsIcon name="pin" size={20} />
              </span>
              <div className="ws-row-main">
                <h2 className="ws-row-title">
                  <Link
                    to="/cabinet/clinics/$id/branches/$branchId"
                    params={{ id, branchId: branch!.id }}
                    search={{ section: undefined }}
                    className="ws-row-link"
                  >
                    {branch!.nameRu || branch!.nameEn}
                  </Link>
                </h2>
                <p className="ws-row-meta">
                  <span>{CITY_LABELS[branch!.city] || branch!.city}</span>
                  {branch!.phone ? <span>{branch!.phone}</span> : null}
                  <span>Doctors: {branch!.doctorCount ?? 0}</span>
                  <span>Services: {branch!.serviceCount ?? 0}</span>
                </p>
              </div>
              <div className="ws-row-end">
                {!locked ? (
                  <button
                    type="button"
                    className="ws-pill is-icon is-danger"
                    aria-label="Delete branch"
                    title="Delete branch"
                    onClick={async () => {
                      if (!window.confirm(`Delete the branch “${branch!.nameRu || branch!.nameEn}”?`)) return;
                      await deleteCabinetBranch(id, branch!.id);
                      await branches.refetch();
                    }}
                  >
                    <WsIcon name="trash" size={17} />
                  </button>
                ) : null}
                <span className="ws-row-arrow" aria-hidden="true">
                  <ArrowIcon size={15} />
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!branches.isLoading && list.length === 0 ? (
        <div className="ws-empty">
          <span className="ws-empty-mark">
            <img src="/brand/logo.svg" alt="" width={40} height={40} />
          </span>
          <h2>No branches yet</h2>
          <p>Add the first branch with an address and a phone. Without it the clinic cannot be sent for review.</p>
          {!locked ? (
            <Link to="/cabinet/clinics/$id/branches/new" params={{ id }} className="pill-btn is-ink">
              Add a branch
              <span className="pill-btn-icon">
                <WsIcon name="plus" size={18} />
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
