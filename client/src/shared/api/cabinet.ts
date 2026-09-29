import { api } from "./client";

export type ClinicStatus =
  | "draft"
  | "moderation"
  | "needs_changes"
  | "approved"
  | "published";

export type ClinicPhoto = {
  id: string;
  url: string;
  category: string;
  altRu: string;
  altEn: string;
  sortOrder: number;
};

export type CabinetDoctor = {
  id: string;
  nameRu: string;
  nameEn: string;
  roleRu: string;
  roleEn: string;
  category?: string;
  bioRu: string;
  bioEn: string;
  certsRu?: string;
  certsEn?: string;
  continuingEducationRu?: string;
  continuingEducationEn?: string;
  internationalExperienceRu?: string;
  internationalExperienceEn?: string;
  researchActivityRu?: string;
  researchActivityEn?: string;
  awardsRu?: string;
  awardsEn?: string;
  achievementsRu?: string;
  achievementsEn?: string;
  photoUrl: string | null;
  experienceYears: number | null;
  branchIds: string[];
  specialties: { id: string; slug: string; nameRu: string; nameEn: string }[];
};

export type CabinetService = {
  id: string;
  clinicId: string;
  branchId: string | null;
  specialtyId: string;
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  priceUsd: number | null;
  currency: string;
  unit: string;
  specialty?: { id: string; slug: string; nameRu: string; nameEn: string } | null;
};

export type CabinetEquipment = {
  id: string;
  clinicId?: string;
  branchId?: string | null;
  nameRu: string;
  nameEn: string;
  manufacturer?: string;
  descriptionRu: string;
  descriptionEn: string;
  photoUrl: string | null;
  sortOrder?: number;
};

export type AchievementItem = {
  id?: string;
  titleRu: string;
  titleEn?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  year?: number | null;
};

export type LeaderItem = {
  id?: string;
  name: string;
  roleRu?: string;
  roleEn?: string;
  bioRu?: string;
  bioEn?: string;
  photoUrl?: string | null;
};

export type TechnologyItem = {
  id?: string;
  nameRu: string;
  nameEn?: string;
  descriptionRu?: string;
  descriptionEn?: string;
};

export type SocialItem = { label: string; url: string };

export type CabinetClinic = {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  shortName?: string | null;
  foundedYear?: number | null;
  city: string;
  addressEn: string;
  addressRu: string;
  lat?: number | null;
  lng?: number | null;
  descriptionEn: string;
  descriptionRu: string;
  historyEn?: string | null;
  historyRu?: string | null;
  missionEn?: string | null;
  missionRu?: string | null;
  advantagesEn?: string | null;
  advantagesRu?: string | null;
  phone: string;
  email: string;
  website: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  socials?: SocialItem[];
  languages: string[];
  logoUrl: string | null;
  coverColor: string;
  status: ClinicStatus;
  moderatorNote: string | null;
  published: boolean;
  founderName?: string | null;
  founderRoleEn?: string | null;
  founderRoleRu?: string | null;
  founderBioEn?: string | null;
  founderBioRu?: string | null;
  founderPhotoUrl?: string | null;
  achievements?: AchievementItem[];
  leaders?: LeaderItem[];
  technologies?: TechnologyItem[];
  coordinatorName?: string | null;
  coordinatorRoleEn?: string | null;
  coordinatorRoleRu?: string | null;
  chiefDoctorName?: string | null;
  chiefDoctorRoleEn?: string | null;
  chiefDoctorRoleRu?: string | null;
  chiefDoctorPhotoUrl?: string | null;
  chiefDoctorBioEn?: string | null;
  chiefDoctorBioRu?: string | null;
  responseHours: number;
  whyChooseEn?: string | null;
  whyChooseRu?: string | null;
  popularServicesEn?: string | null;
  popularServicesRu?: string | null;
  developmentPlansEn?: string | null;
  developmentPlansRu?: string | null;
  medicalTourism?: boolean;
  medicalTourismEn?: string | null;
  medicalTourismRu?: string | null;
  updatedAt: string;
  createdAt: string;
  specialtyIds: string[];
  specialties: { id: string; slug: string; nameRu: string; nameEn: string }[];
  photos?: ClinicPhoto[];
  doctors?: CabinetDoctor[];
  equipment?: {
    id: string;
    nameRu: string;
    nameEn: string;
    manufacturer?: string;
    descriptionRu: string;
    descriptionEn: string;
    photoUrl: string | null;
  }[];
  certificates?: {
    id: string;
    nameRu: string;
    nameEn: string;
    issuerRu: string;
    issuerEn: string;
    year: number | null;
    receivedAt?: string | null;
    validUntil?: string | null;
    imageUrl: string | null;
    fileUrl?: string | null;
  }[];
  branchCount?: number;
  doctorCount?: number;
  branches?: {
    id: string;
    slug: string;
    nameRu: string;
    nameEn: string;
    city: string;
    phone: string;
    addressRu?: string;
    addressEn?: string;
    lat?: number | null;
    lng?: number | null;
    coverUrl?: string | null;
    doctorCount: number;
    serviceCount: number;
    specialtyCount?: number;
    photoCount?: number;
    specialties?: { id: string; slug: string; nameRu: string; nameEn: string }[];
  }[];
};

export type ClinicFormPayload = Partial<{
  nameRu: string;
  nameEn: string;
  shortName: string | null;
  foundedYear: number | null;
  slug: string;
  city: string;
  addressRu: string;
  addressEn: string;
  lat: number | null;
  lng: number | null;
  descriptionRu: string;
  descriptionEn: string;
  historyRu: string | null;
  historyEn: string | null;
  missionRu: string | null;
  missionEn: string | null;
  advantagesRu: string | null;
  advantagesEn: string | null;
  phone: string;
  email: string;
  website: string | null;
  whatsapp: string | null;
  telegram: string | null;
  instagram: string | null;
  youtube: string | null;
  socials: SocialItem[];
  languages: string[];
  coverColor: string;
  logoUrl: string | null;
  specialtyIds: string[];
  customSpecialties: { nameRu: string; nameEn?: string }[];
  founderName: string | null;
  founderRoleRu: string | null;
  founderRoleEn: string | null;
  founderBioRu: string | null;
  founderBioEn: string | null;
  founderPhotoUrl: string | null;
  achievements: AchievementItem[];
  leaders: LeaderItem[];
  technologies: TechnologyItem[];
  coordinatorName: string | null;
  coordinatorRoleRu: string | null;
  coordinatorRoleEn: string | null;
  chiefDoctorName: string | null;
  chiefDoctorRoleRu: string | null;
  chiefDoctorRoleEn: string | null;
  chiefDoctorPhotoUrl: string | null;
  chiefDoctorBioRu: string | null;
  chiefDoctorBioEn: string | null;
  responseHours: number;
  whyChooseRu: string | null;
  whyChooseEn: string | null;
  popularServicesRu: string | null;
  popularServicesEn: string | null;
  developmentPlansRu: string | null;
  developmentPlansEn: string | null;
  medicalTourism: boolean;
  medicalTourismRu: string | null;
  medicalTourismEn: string | null;
}>;

export async function cabinetLogin(email: string, password: string) {
  await api.post("/api/cabinet/login", { email, password });
}

export async function cabinetRegister(payload: { email: string; password: string; name: string }) {
  await api.post("/api/cabinet/register", payload);
}

export async function cabinetLogout() {
  await api.post("/api/cabinet/logout");
}

export type CabinetOwner = { id: string; email: string; name: string };

export async function cabinetMe() {
  const { data } = await api.get<{ authenticated: boolean; owner?: CabinetOwner }>("/api/cabinet/me");
  return data.authenticated;
}

export async function cabinetMeFull() {
  const { data } = await api.get<{ authenticated: boolean; owner?: CabinetOwner }>("/api/cabinet/me");
  return data;
}

export async function fetchCabinetClinics() {
  const { data } = await api.get<{ items: CabinetClinic[] }>("/api/cabinet/clinics");
  return data.items;
}

export async function fetchCabinetClinic(id: string) {
  const { data } = await api.get<CabinetClinic>(`/api/cabinet/clinics/${id}`);
  return data;
}

export async function fetchCabinetBranches(clinicId: string) {
  const { data } = await api.get<{
    items: Array<{
      id: string;
      slug: string;
      nameRu: string;
      nameEn: string;
      city: string;
      phone: string;
      doctorCount: number;
      serviceCount: number;
    }>;
  }>(`/api/cabinet/clinics/${clinicId}/branches`);
  return data.items ?? [];
}

export async function fetchCabinetBranch(clinicId: string, branchId: string) {
  const { data } = await api.get<CabinetBranch>(`/api/cabinet/clinics/${clinicId}/branches/${branchId}`);
  return data;
}

export type BranchScheduleDay = {
  open: string;
  close: string;
  roundTheClock?: boolean;
  breakStart?: string | null;
  breakEnd?: string | null;
} | null;
export type BranchSchedule = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", BranchScheduleDay>
>;

export type CabinetBranch = {
  id: string;
  clinicId: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  city: string;
  country?: string;
  region?: string | null;
  district?: string | null;
  street?: string | null;
  building?: string | null;
  addressExtra?: string | null;
  addressEn: string;
  addressRu: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  phones?: string[];
  email: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  website?: string | null;
  instagram?: string | null;
  socials?: SocialItem[];
  descriptionEn: string;
  descriptionRu: string;
  advantagesRu?: string;
  featuresRu?: string;
  medicalTourism?: boolean;
  medicalTourismInfoRu?: string;
  coverUrl: string | null;
  sortOrder: number;
  schedule: BranchSchedule;
  specialtyIds: string[];
  specialties: { id: string; slug: string; nameRu: string; nameEn: string }[];
  photos: ClinicPhoto[];
  doctors?: CabinetDoctor[];
  services?: CabinetService[];
  equipment?: CabinetEquipment[];
  clinic?: { id: string; slug: string; nameRu: string; nameEn: string; logoUrl?: string | null };
};

export type BranchFormPayload = {
  nameRu: string;
  nameEn: string;
  slug?: string;
  city: string;
  country?: string;
  region?: string | null;
  district?: string | null;
  street?: string | null;
  building?: string | null;
  addressExtra?: string | null;
  addressRu: string;
  addressEn: string;
  lat?: number | null;
  lng?: number | null;
  phone: string;
  phones?: string[];
  email?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  website?: string | null;
  instagram?: string | null;
  socials?: SocialItem[];
  descriptionRu?: string;
  descriptionEn?: string;
  advantagesRu?: string;
  featuresRu?: string;
  medicalTourism?: boolean;
  medicalTourismInfoRu?: string;
  coverUrl?: string | null;
  specialtyIds: string[];
  schedule?: BranchSchedule;
  sortOrder?: number;
};

export async function createCabinetBranch(clinicId: string, payload: BranchFormPayload) {
  const { data } = await api.post<CabinetBranch>(`/api/cabinet/clinics/${clinicId}/branches`, payload);
  return data;
}

export async function updateCabinetBranch(
  clinicId: string,
  branchId: string,
  payload: BranchFormPayload,
) {
  const { data } = await api.put<CabinetBranch>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}`,
    payload,
  );
  return data;
}

export async function deleteCabinetBranch(clinicId: string, branchId: string) {
  await api.delete(`/api/cabinet/clinics/${clinicId}/branches/${branchId}`);
}

export async function addBranchPhoto(
  clinicId: string,
  branchId: string,
  payload: { url: string; category?: string; altRu?: string },
) {
  const { data } = await api.post<ClinicPhoto>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/photos`,
    payload,
  );
  return data;
}

export async function deleteBranchPhoto(clinicId: string, branchId: string, photoId: string) {
  await api.delete(`/api/cabinet/clinics/${clinicId}/branches/${branchId}/photos/${photoId}`);
}

export async function createCabinetClinic(payload: ClinicFormPayload) {
  const { data } = await api.post<CabinetClinic>("/api/cabinet/clinics", payload);
  return data;
}

export async function updateCabinetClinic(id: string, payload: ClinicFormPayload) {
  const { data } = await api.put<CabinetClinic>(`/api/cabinet/clinics/${id}`, payload);
  return data;
}

export async function deleteCabinetClinic(id: string) {
  await api.delete(`/api/cabinet/clinics/${id}`);
}

export async function submitCabinetClinic(id: string) {
  const { data } = await api.post<CabinetClinic>(`/api/cabinet/clinics/${id}/submit`);
  return data;
}

export async function uploadCabinetFile(file: File, purpose?: "logo") {
  const form = new FormData();
  if (purpose) form.append("purpose", purpose);
  form.append("file", file);
  const { data } = await api.post<{ url: string }>("/api/cabinet/upload", form);
  return data.url;
}

export async function addClinicPhoto(
  clinicId: string,
  payload: { url: string; category?: string; altRu?: string; altEn?: string },
) {
  const { data } = await api.post<ClinicPhoto>(`/api/cabinet/clinics/${clinicId}/photos`, payload);
  return data;
}

export async function deleteClinicPhoto(clinicId: string, photoId: string) {
  await api.delete(`/api/cabinet/clinics/${clinicId}/photos/${photoId}`);
}

export async function reorderClinicPhotos(clinicId: string, photoIds: string[]) {
  const { data } = await api.put<{ items: ClinicPhoto[] }>(
    `/api/cabinet/clinics/${clinicId}/photos/reorder`,
    { photoIds },
  );
  return data.items;
}

export async function setClinicMainPhoto(clinicId: string, photoId: string) {
  const { data } = await api.post<{ items: ClinicPhoto[] }>(
    `/api/cabinet/clinics/${clinicId}/photos/${photoId}/main`,
  );
  return data.items;
}

export async function replaceClinicPhoto(
  clinicId: string,
  photoId: string,
  payload: { url?: string; category?: string; altRu?: string; altEn?: string },
) {
  const { data } = await api.patch<ClinicPhoto>(
    `/api/cabinet/clinics/${clinicId}/photos/${photoId}`,
    payload,
  );
  return data;
}

export async function reorderBranchPhotos(clinicId: string, branchId: string, photoIds: string[]) {
  const { data } = await api.put<{ items: ClinicPhoto[] }>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/photos/reorder`,
    { photoIds },
  );
  return data.items;
}

export async function setBranchMainPhoto(clinicId: string, branchId: string, photoId: string) {
  const { data } = await api.post<{ items: ClinicPhoto[] }>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/photos/${photoId}/main`,
  );
  return data.items;
}

export async function replaceBranchPhoto(
  clinicId: string,
  branchId: string,
  photoId: string,
  payload: { url?: string; category?: string; altRu?: string; altEn?: string },
) {
  const { data } = await api.patch<ClinicPhoto>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/photos/${photoId}`,
    payload,
  );
  return data;
}

export async function addClinicSpecialty(clinicId: string, payload: { nameRu: string; nameEn?: string }) {
  const { data } = await api.post(`/api/cabinet/clinics/${clinicId}/specialties`, payload);
  return data;
}

export async function addClinicDoctor(
  clinicId: string,
  payload: {
    nameRu: string;
    nameEn: string;
    roleRu?: string;
    roleEn?: string;
    bioRu?: string;
    bioEn?: string;
    category?: string;
    certsRu?: string;
    certsEn?: string;
    continuingEducationRu?: string;
    continuingEducationEn?: string;
    internationalExperienceRu?: string;
    internationalExperienceEn?: string;
    researchActivityRu?: string;
    researchActivityEn?: string;
    awardsRu?: string;
    awardsEn?: string;
    achievementsRu?: string;
    achievementsEn?: string;
    photoUrl?: string | null;
    experienceYears?: number | null;
    specialtyIds?: string[];
    branchIds?: string[];
  },
) {
  const { data } = await api.post<CabinetDoctor>(`/api/cabinet/clinics/${clinicId}/doctors`, payload);
  return data;
}

export async function updateClinicDoctor(
  clinicId: string,
  doctorId: string,
  payload: {
    nameRu?: string;
    nameEn?: string;
    roleRu?: string;
    roleEn?: string;
    bioRu?: string;
    bioEn?: string;
    category?: string;
    certsRu?: string;
    certsEn?: string;
    continuingEducationRu?: string;
    continuingEducationEn?: string;
    internationalExperienceRu?: string;
    internationalExperienceEn?: string;
    researchActivityRu?: string;
    researchActivityEn?: string;
    awardsRu?: string;
    awardsEn?: string;
    achievementsRu?: string;
    achievementsEn?: string;
    photoUrl?: string | null;
    experienceYears?: number | null;
    specialtyIds?: string[];
    branchIds?: string[];
  },
) {
  const { data } = await api.put<CabinetDoctor>(
    `/api/cabinet/clinics/${clinicId}/doctors/${doctorId}`,
    payload,
  );
  return data;
}

export async function deleteClinicDoctor(clinicId: string, doctorId: string) {
  await api.delete(`/api/cabinet/clinics/${clinicId}/doctors/${doctorId}`);
}

export async function setBranchDoctors(clinicId: string, branchId: string, doctorIds: string[]) {
  const { data } = await api.put<{ doctors: CabinetDoctor[] }>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/doctors`,
    { doctorIds },
  );
  return data.doctors;
}

export type ServiceFormPayload = {
  nameRu: string;
  nameEn: string;
  specialtyId: string;
  descriptionRu?: string;
  descriptionEn?: string;
  priceUsd?: number | null;
  currency?: "UZS" | "USD";
  unit?: string;
};

export async function addBranchService(
  clinicId: string,
  branchId: string,
  payload: ServiceFormPayload,
) {
  const { data } = await api.post<CabinetService>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/services`,
    payload,
  );
  return data;
}

export async function updateBranchService(
  clinicId: string,
  branchId: string,
  serviceId: string,
  payload: ServiceFormPayload,
) {
  const { data } = await api.put<CabinetService>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/services/${serviceId}`,
    payload,
  );
  return data;
}

export async function deleteBranchService(clinicId: string, branchId: string, serviceId: string) {
  await api.delete(`/api/cabinet/clinics/${clinicId}/branches/${branchId}/services/${serviceId}`);
}

export type EquipmentFormPayload = {
  nameRu: string;
  nameEn: string;
  manufacturer?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  photoUrl?: string | null;
};

export async function addBranchEquipment(
  clinicId: string,
  branchId: string,
  payload: EquipmentFormPayload,
) {
  const { data } = await api.post<CabinetEquipment>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/equipment`,
    payload,
  );
  return data;
}

export async function updateBranchEquipment(
  clinicId: string,
  branchId: string,
  itemId: string,
  payload: EquipmentFormPayload,
) {
  const { data } = await api.put<CabinetEquipment>(
    `/api/cabinet/clinics/${clinicId}/branches/${branchId}/equipment/${itemId}`,
    payload,
  );
  return data;
}

export async function deleteBranchEquipment(clinicId: string, branchId: string, itemId: string) {
  await api.delete(`/api/cabinet/clinics/${clinicId}/branches/${branchId}/equipment/${itemId}`);
}

export async function addClinicEquipment(
  clinicId: string,
  payload: {
    nameRu: string;
    nameEn: string;
    manufacturer?: string;
    descriptionRu?: string;
    descriptionEn?: string;
    photoUrl?: string | null;
    branchId?: string | null;
  },
) {
  const { data } = await api.post(`/api/cabinet/clinics/${clinicId}/equipment`, payload);
  return data;
}

export async function deleteClinicEquipment(clinicId: string, itemId: string) {
  await api.delete(`/api/cabinet/clinics/${clinicId}/equipment/${itemId}`);
}

export async function addClinicCertificate(
  clinicId: string,
  payload: {
    nameRu: string;
    nameEn: string;
    issuerRu?: string;
    issuerEn?: string;
    year?: number | null;
    receivedAt?: string | null;
    validUntil?: string | null;
    imageUrl?: string | null;
    fileUrl?: string | null;
  },
) {
  const { data } = await api.post(`/api/cabinet/clinics/${clinicId}/certificates`, payload);
  return data;
}

export async function deleteClinicCertificate(clinicId: string, itemId: string) {
  await api.delete(`/api/cabinet/clinics/${clinicId}/certificates/${itemId}`);
}

export async function adminLogin(password: string) {
  await api.post("/api/admin/login", { password });
}

export async function adminLogout() {
  await api.post("/api/admin/logout");
}

export async function adminMe() {
  const { data } = await api.get<{ authenticated: boolean }>("/api/admin/me");
  return data.authenticated;
}

export async function fetchModerationQueue(status = "all") {
  const { data } = await api.get<{ items: CabinetClinic[] }>("/api/admin/moderation", {
    params: { status },
  });
  return data.items;
}

export type ModerationChecklist = {
  required: { key: string; label: string; ok: boolean }[];
  recommended: { key: string; label: string; ok: boolean }[];
  ready: boolean;
};

export type ModerationClinic = CabinetClinic & {
  checklist?: ModerationChecklist;
  moderationLogs?: { id: string; action: string; note: string | null; createdAt: string }[];
};

export async function fetchModerationClinic(id: string) {
  const { data } = await api.get<ModerationClinic>(`/api/admin/moderation/${id}`);
  return data;
}

export async function approveClinic(id: string) {
  const { data } = await api.post<CabinetClinic>(`/api/admin/moderation/${id}/approve`);
  return data;
}

export async function rejectClinic(id: string, note: string) {
  const { data } = await api.post<CabinetClinic>(`/api/admin/moderation/${id}/reject`, { note });
  return data;
}

export async function publishClinic(id: string) {
  const { data } = await api.post<CabinetClinic>(`/api/admin/moderation/${id}/publish`);
  return data;
}

export async function unpublishClinic(id: string) {
  const { data } = await api.post<CabinetClinic>(`/api/admin/moderation/${id}/unpublish`);
  return data;
}

export type CabinetLead = {
  id: string;
  fullName: string;
  country: string;
  phone: string;
  email: string | null;
  contactMethod: string;
  arrivalType?: string;
  arrivalDate?: string | null;
  medicalNeed: string | null;
  symptoms: string | null;
  age: number | null;
  source: string;
  status: string;
  preferredHours: string | null;
  notes: string | null;
  recommendedSpecialty: { slug: string; nameRu: string; nameEn: string } | null;
  createdAt: string;
  clinic?: { id: string; slug: string; nameRu: string; nameEn: string };
};

export async function fetchCabinetLeads(clinicId: string, status?: string) {
  const { data } = await api.get<{ items: CabinetLead[] }>(`/api/cabinet/clinics/${clinicId}/leads`, {
    params: status ? { status } : undefined,
  });
  return data.items;
}

export async function updateCabinetLead(
  clinicId: string,
  leadId: string,
  payload: { status?: string; notes?: string | null },
) {
  const { data } = await api.patch<CabinetLead>(
    `/api/cabinet/clinics/${clinicId}/leads/${leadId}`,
    payload,
  );
  return data;
}

export async function fetchAdminLeads(params?: { status?: string; source?: string; q?: string }) {
  const { data } = await api.get<{ items: CabinetLead[] }>("/api/admin/leads", { params });
  return data.items;
}

export async function fetchAdminLead(id: string) {
  const { data } = await api.get<CabinetLead & { emails?: unknown[] }>(`/api/admin/leads/${id}`);
  return data;
}

export async function updateAdminLead(id: string, payload: { status?: string; notes?: string | null }) {
  const { data } = await api.patch<CabinetLead>(`/api/admin/leads/${id}`, payload);
  return data;
}

export const STATUS_LABELS: Record<ClinicStatus, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  needs_changes: "Нужны изменения",
  approved: "Одобрена",
  published: "Опубликована",
};

export const WIZARD_SECTIONS = [
  { id: "basic", label: "Основное" },
  { id: "about", label: "О клинике" },
  { id: "directions", label: "Направления" },
  { id: "leadership", label: "Руководство" },
  { id: "doctors", label: "Специалисты" },
  { id: "equipment", label: "Оснащение" },
  { id: "contacts", label: "Контакты" },
  { id: "photos", label: "Фото" },
  { id: "extra", label: "Дополнительно" },
  { id: "branches", label: "Филиалы" },
  { id: "preview", label: "Предпросмотр" },
  { id: "moderation", label: "Модерация" },
] as const;

export type WizardSectionId = (typeof WIZARD_SECTIONS)[number]["id"];
