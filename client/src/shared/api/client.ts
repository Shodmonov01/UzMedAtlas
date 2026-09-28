import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export type Specialty = {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  explanationEn?: string;
  explanationRu?: string;
};

export type ClinicListItem = {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  city: string;
  addressEn: string;
  addressRu: string;
  descriptionEn: string;
  descriptionRu: string;
  phone: string;
  email: string;
  languages: string[];
  logoUrl: string | null;
  coverColor: string;
  responseHours: number;
  medicalTourism?: boolean;
  fromPrice: number | null;
  specialties: Specialty[];
  branchCount?: number;
};

export type BranchSummary = {
  id: string;
  clinicId: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  city: string;
  addressEn: string;
  addressRu: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  email: string | null;
  descriptionEn: string;
  descriptionRu: string;
  coverUrl: string | null;
  sortOrder: number;
  schedule: Record<string, { open: string; close: string } | null>;
  specialties: Specialty[];
  photoCount: number;
  doctorCount: number;
  serviceCount: number;
};

export async function fetchClinics(params?: Record<string, string | undefined>) {
  const { data } = await api.get<{ items: ClinicListItem[] }>("/api/clinics", { params });
  return data.items;
}

export async function fetchClinic(slug: string) {
  const { data } = await api.get(`/api/clinics/${slug}`);
  return data;
}

export async function fetchClinicBranches(slug: string) {
  const { data } = await api.get<{ items: BranchSummary[] }>(`/api/clinics/${slug}/branches`);
  return data.items;
}

export async function fetchClinicBranch(slug: string, branchSlug: string) {
  const { data } = await api.get(`/api/clinics/${slug}/branches/${branchSlug}`);
  return data;
}

export async function fetchSpecialties() {
  const { data } = await api.get<{ items: Specialty[] }>("/api/specialties");
  return data.items;
}

export async function analyzeChecker(payload: {
  symptoms: string;
  age: number;
  gender: "female" | "male" | "prefer_not";
  duration: "few_days" | "few_weeks" | "few_months" | "more_than_year";
  forChild?: boolean;
}) {
  const { data } = await api.post("/api/checker/analyze", payload);
  return data;
}

export type LeadPayload = {
  fullName: string;
  country: string;
  phone: string;
  email?: string | null;
  contactMethod: "whatsapp" | "telegram" | "phone" | "email";
  arrivalType?: "exact" | "approximate" | "undecided";
  arrivalDate?: string | null;
  medicalNeed?: string | null;
  symptoms?: string | null;
  preferredHours?: "anytime" | "morning" | "afternoon" | "evening";
  consent: true;
  idempotencyKey?: string;
  company?: string;
  source?: "catalog" | "checker";
  specialtySlug?: string | null;
  age?: number | null;
  gender?: "female" | "male" | "prefer_not" | null;
  duration?: "few_days" | "few_weeks" | "few_months" | "more_than_year" | null;
  forChild?: boolean;
};

export async function submitClinicLead(slug: string, payload: LeadPayload) {
  const { data } = await api.post<{ ok: boolean; id: string; duplicate?: boolean }>(
    `/api/clinics/${slug}/leads`,
    payload,
  );
  return data;
}

export const CITY_LABELS: Record<string, string> = {
  tashkent: "Ташкент",
  samarkand: "Самарканд",
  bukhara: "Бухара",
};
