import type { ClinicStatus } from "@/shared/api/cabinet";
import { STATUS_LABELS } from "@/shared/api/cabinet";

/* The moderation side is in Russian for the association staff; the clinic cabinet uses the English labels. */
export const STATUS_LABELS_RU: Record<ClinicStatus, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  needs_changes: "Нужны изменения",
  approved: "Одобрена",
  published: "Опубликована",
};

/** A clinic's review status: a dot and the word on a soft fill of the status colour. */
export function StatusBadge({ status, ru = false }: { status: ClinicStatus; ru?: boolean }) {
  return <span className={`ws-status is-${status}`}>{(ru ? STATUS_LABELS_RU : STATUS_LABELS)[status]}</span>;
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "In contact",
  closed: "Closed",
};

export const LEAD_STATUS_LABELS_RU: Record<string, string> = {
  new: "Новая",
  contacted: "На связи",
  closed: "Закрыта",
};

/** A patient request's status in the same look. */
export function LeadStatusBadge({ status, ru = false }: { status: string; ru?: boolean }) {
  return <span className={`ws-status is-${status}`}>{(ru ? LEAD_STATUS_LABELS_RU : LEAD_STATUS_LABELS)[status] || status}</span>;
}

export const CONTACT_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  phone: "Phone call",
  email: "Email",
};

export const CONTACT_LABELS_RU: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  phone: "Звонок",
  email: "Email",
};
