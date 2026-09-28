import type { ClinicStatus } from "@/shared/api/cabinet";
import { STATUS_LABELS } from "@/shared/api/cabinet";

const COLORS: Record<ClinicStatus, string> = {
  draft: "bg-sand text-muted",
  moderation: "bg-warning-soft text-warning",
  needs_changes: "bg-danger-soft text-danger",
  approved: "bg-mint text-primary-deep",
  published: "bg-success-soft text-success",
};

export function StatusBadge({ status }: { status: ClinicStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
