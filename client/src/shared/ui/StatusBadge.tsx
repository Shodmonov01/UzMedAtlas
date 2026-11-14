import type { ClinicStatus } from "@/shared/api/cabinet";
import { STATUS_LABELS } from "@/shared/api/cabinet";

/** A clinic's review status: a dot and the word on a soft fill of the status colour. */
export function StatusBadge({ status }: { status: ClinicStatus }) {
  return <span className={`ws-status is-${status}`}>{STATUS_LABELS[status]}</span>;
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "In contact",
  closed: "Closed",
};

/** A patient request's status in the same look. */
export function LeadStatusBadge({ status }: { status: string }) {
  return <span className={`ws-status is-${status}`}>{LEAD_STATUS_LABELS[status] || status}</span>;
}

export const CONTACT_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  phone: "Phone call",
  email: "Email",
};
