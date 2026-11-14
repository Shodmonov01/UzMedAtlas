import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminMe, fetchModerationQueue } from "@/shared/api/cabinet";
import { CITY_LABELS } from "@/shared/api/client";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { ClinicLogo } from "@/shared/ui/ClinicLogo";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { PageHead, WsLoading, WsNote } from "@/widgets/workspace/Workspace";

export const Route = createFileRoute("/moderation/")({
  component: ModerationQueuePage,
});

const FILTERS = [
  ["moderation", "In review"],
  ["needs_changes", "Needs changes"],
  ["approved", "Approved"],
  ["published", "Published"],
  ["all", "All"],
] as const;

function ModerationQueuePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("moderation");
  const [q, setQ] = useState("");
  const auth = useQuery({ queryKey: ["admin-me"], queryFn: adminMe, retry: false });
  const queue = useQuery({
    queryKey: ["moderation-queue", status],
    queryFn: () => fetchModerationQueue(status),
    enabled: auth.data === true,
  });

  useEffect(() => {
    if (auth.isError || auth.data === false) {
      void navigate({ to: "/moderation/login" });
    }
  }, [auth.data, auth.isError, navigate]);

  if (auth.isLoading || !auth.data) return <WsLoading label="Checking your session…" />;

  const needle = q.trim().toLowerCase();
  const list = (queue.data || []).filter(
    (clinic) => !needle || `${clinic.nameRu} ${clinic.nameEn} ${clinic.city}`.toLowerCase().includes(needle),
  );

  return (
    <div className="ws-stack">
      <PageHead
        eyebrow="Moderation"
        title="Clinic queue"
        lead="Check the profile against the checklist, then approve and publish the clinic or send it back with a comment."
      />

      <div className="ws-toolbar">
        <div className="ws-seg" role="tablist" aria-label="Status">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={status === value}
              className={status === value ? "is-active" : undefined}
              onClick={() => setStatus(value)}
            >
              {label}
              {status === value && queue.data ? <b>{queue.data.length}</b> : null}
            </button>
          ))}
        </div>
        <label className="ws-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a clinic or city" aria-label="Search clinics" />
        </label>
      </div>

      {queue.isLoading ? <WsLoading label="Loading the queue…" inline /> : null}
      {queue.isError ? <WsNote tone="danger" title="Could not load the queue" /> : null}

      {list.length ? (
        <div className="ws-rows">
          {list.map((clinic) => {
            const name = clinic.nameRu || clinic.nameEn;
            return (
              <article key={clinic.id} className="ws-row">
                <ClinicLogo src={clinic.logoUrl} name={name} className="h-12 w-12 rounded-2xl" />
                <div className="ws-row-main">
                  <h2 className="ws-row-title">
                    <Link to="/moderation/$id" params={{ id: clinic.id }} className="ws-row-link">
                      {name}
                    </Link>
                    <StatusBadge status={clinic.status} />
                  </h2>
                  <p className="ws-row-meta">
                    <span>{CITY_LABELS[clinic.city] || clinic.city}</span>
                    {clinic.branchCount != null ? <span>Branches: {clinic.branchCount}</span> : null}
                    <span>Updated {new Date(clinic.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </p>
                </div>
                <div className="ws-row-end">
                  <span className="hidden text-sm font-semibold text-ink sm:inline">{clinic.status === "moderation" ? "Review" : "Open"}</span>
                  <span className="ws-row-arrow" aria-hidden="true">
                    <ArrowIcon size={15} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {queue.data && list.length === 0 ? (
        <div className="ws-empty">
          <span className="ws-empty-mark">
            <img src="/brand/logo.svg?v=2" alt="" width={40} height={40} />
          </span>
          <h2>{needle ? "Nothing found" : "The queue is empty"}</h2>
          <p>{needle ? "Try another name or city." : "No new clinics to review. When an owner sends a profile, it shows up here."}</p>
        </div>
      ) : null}
    </div>
  );
}
