import type { ClinicStatus } from "./constants";
import { CLINIC_STATUSES } from "./constants";

export function isClinicStatus(value: string): value is ClinicStatus {
  return (CLINIC_STATUSES as readonly string[]).includes(value);
}

export function publishedFromStatus(status: ClinicStatus) {
  return status === "published";
}

export type ClinicValidationIssue = { field: string; message: string };

export function validateClinicForModeration(clinic: {
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  phone: string;
  email: string;
  city: string;
  addressRu: string;
  addressEn: string;
  specialties: unknown[];
  branches?: {
    city: string;
    addressRu: string;
    addressEn: string;
    phone: string;
  }[];
}): ClinicValidationIssue[] {
  const issues: ClinicValidationIssue[] = [];
  if (!clinic.nameRu.trim() && !clinic.nameEn.trim()) {
    issues.push({ field: "name", message: "Укажите название клиники" });
  }
  if (!clinic.descriptionRu.trim() && !clinic.descriptionEn.trim()) {
    issues.push({ field: "description", message: "Добавьте описание" });
  }
  if (!clinic.phone.trim()) {
    issues.push({ field: "phone", message: "Укажите телефон" });
  }
  if (!clinic.email.trim()) {
    issues.push({ field: "email", message: "Укажите email" });
  }
  if (!clinic.city.trim()) {
    issues.push({ field: "city", message: "Укажите город" });
  }
  if (!clinic.addressRu.trim() && !clinic.addressEn.trim()) {
    issues.push({ field: "address", message: "Укажите адрес" });
  }
  if (!clinic.specialties.length) {
    issues.push({ field: "specialties", message: "Выберите хотя бы одно направление" });
  }
  const branches = clinic.branches ?? [];
  if (!branches.length) {
    issues.push({ field: "branches", message: "Добавьте хотя бы один филиал" });
  } else {
    branches.forEach((branch, index) => {
      const n = index + 1;
      if (!branch.city.trim()) {
        issues.push({ field: `branches.${index}.city`, message: `Филиал ${n}: укажите город` });
      }
      if (!branch.addressRu.trim() && !branch.addressEn.trim()) {
        issues.push({ field: `branches.${index}.address`, message: `Филиал ${n}: укажите адрес` });
      }
      if (!branch.phone.trim()) {
        issues.push({ field: `branches.${index}.phone`, message: `Филиал ${n}: укажите телефон` });
      }
    });
  }
  return issues;
}

/** Checklist for moderator UI: required + recommended items */
export function buildModerationChecklist(clinic: {
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  phone: string;
  email: string;
  city: string;
  addressRu: string;
  addressEn: string;
  logoUrl?: string | null;
  specialties: unknown[];
  branches?: {
    city: string;
    addressRu: string;
    addressEn: string;
    phone: string;
  }[];
  photos?: unknown[];
  doctors?: unknown[];
  equipment?: unknown[];
}): {
  required: { key: string; label: string; ok: boolean }[];
  recommended: { key: string; label: string; ok: boolean }[];
  ready: boolean;
} {
  const issues = validateClinicForModeration(clinic);
  const issueFields = new Set(issues.map((i) => i.field.split(".")[0]));

  const required = [
    { key: "name", label: "Название клиники", ok: !issueFields.has("name") },
    { key: "description", label: "Описание", ok: !issueFields.has("description") },
    { key: "contacts", label: "Телефон и email", ok: !issueFields.has("phone") && !issueFields.has("email") },
    { key: "address", label: "Город и адрес", ok: !issueFields.has("city") && !issueFields.has("address") },
    { key: "specialties", label: "Направления", ok: !issueFields.has("specialties") },
    {
      key: "branches",
      label: "Филиал с адресом и телефоном",
      ok: !issues.some((i) => i.field.startsWith("branches")),
    },
  ];

  const recommended = [
    { key: "logo", label: "Логотип", ok: Boolean(clinic.logoUrl) },
    { key: "photos", label: "Фотографии", ok: (clinic.photos?.length ?? 0) > 0 },
    { key: "doctors", label: "Специалисты", ok: (clinic.doctors?.length ?? 0) > 0 },
    { key: "equipment", label: "Оборудование", ok: (clinic.equipment?.length ?? 0) > 0 },
  ];

  return {
    required,
    recommended,
    ready: required.every((item) => item.ok),
  };
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `clinic-${Date.now()}`;
}
