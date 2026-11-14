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
  logoUrl?: string | null;
  specialties: unknown[];
  branches?: {
    id?: string;
    city: string;
    addressRu: string;
    addressEn: string;
    phone: string;
    specialties?: unknown[];
  }[];
}): ClinicValidationIssue[] {
  const issues: ClinicValidationIssue[] = [];
  if (!clinic.nameRu.trim() && !clinic.nameEn.trim()) {
    issues.push({ field: "name", message: "Enter the clinic name" });
  }
  if (!clinic.descriptionRu.trim() && !clinic.descriptionEn.trim()) {
    issues.push({ field: "description", message: "Add a description" });
  }
  if (!clinic.phone.trim()) {
    issues.push({ field: "phone", message: "Enter a phone number" });
  }
  if (!clinic.email.trim()) {
    issues.push({ field: "email", message: "Enter an email" });
  }
  if (!clinic.city.trim()) {
    issues.push({ field: "city", message: "Enter the city" });
  }
  if (!clinic.addressRu.trim() && !clinic.addressEn.trim()) {
    issues.push({ field: "address", message: "Enter the address" });
  }
  if (!clinic.specialties.length) {
    issues.push({ field: "specialties", message: "Choose at least one specialty" });
  }
  if (!clinic.logoUrl) {
    issues.push({ field: "logo", message: "Upload the clinic logo" });
  }
  const branches = clinic.branches ?? [];
  if (!branches.length) {
    issues.push({ field: "branches", message: "Add at least one branch" });
  } else {
    branches.forEach((branch, index) => {
      const n = index + 1;
      const branchField = `branches.${branch.id || index}`;
      if (!branch.city.trim()) {
        issues.push({ field: `${branchField}.city`, message: `Branch ${n}: enter the city` });
      }
      if (!branch.addressRu.trim() && !branch.addressEn.trim()) {
        issues.push({ field: `${branchField}.address`, message: `Branch ${n}: enter the address` });
      }
      if (!branch.phone.trim()) {
        issues.push({ field: `${branchField}.phone`, message: `Branch ${n}: enter a phone number` });
      }
      if (!branch.specialties?.length) {
        issues.push({ field: `${branchField}.specialties`, message: `Branch ${n}: choose specialties` });
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
    id?: string;
    city: string;
    addressRu: string;
    addressEn: string;
    phone: string;
    specialties?: unknown[];
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
    { key: "name", label: "Clinic name", ok: !issueFields.has("name") },
    { key: "logo", label: "Logo", ok: !issueFields.has("logo") },
    { key: "description", label: "Description", ok: !issueFields.has("description") },
    { key: "contacts", label: "Phone and email", ok: !issueFields.has("phone") && !issueFields.has("email") },
    { key: "address", label: "City and address", ok: !issueFields.has("city") && !issueFields.has("address") },
    { key: "specialties", label: "Specialties", ok: !issueFields.has("specialties") },
    {
      key: "branches",
      label: "A branch with an address, phone and specialty",
      ok: !issues.some((i) => i.field.startsWith("branches")),
    },
  ];

  const recommended = [
    { key: "photos", label: "Photos", ok: (clinic.photos?.length ?? 0) > 0 },
    { key: "doctors", label: "Doctors", ok: (clinic.doctors?.length ?? 0) > 0 },
    { key: "equipment", label: "Equipment", ok: (clinic.equipment?.length ?? 0) > 0 },
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
