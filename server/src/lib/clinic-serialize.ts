/** Shared include shapes and serializers for clinic / branch payloads */

export const doctorInclude = {
  specialties: { include: { specialty: true } },
  branches: true,
} as const;

export const clinicDetailInclude = {
  photos: { orderBy: { sortOrder: "asc" as const } },
  specialties: { include: { specialty: true } },
  services: { include: { specialty: true } },
  doctors: {
    orderBy: { sortOrder: "asc" as const },
    include: doctorInclude,
  },
  equipment: { orderBy: { sortOrder: "asc" as const } },
  certificates: { orderBy: { sortOrder: "asc" as const } },
  branches: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      specialties: { include: { specialty: true } },
      photos: { orderBy: { sortOrder: "asc" as const } },
      _count: { select: { doctorLinks: true, services: true } },
    },
  },
  _count: { select: { branches: true, doctors: true } },
} as const;

export const branchDetailInclude = {
  specialties: { include: { specialty: true } },
  photos: { orderBy: { sortOrder: "asc" as const } },
  doctorLinks: {
    include: {
      doctor: {
        include: doctorInclude,
      },
    },
  },
  services: { include: { specialty: true } },
  equipment: { orderBy: { sortOrder: "asc" as const } },
  certificates: { orderBy: { sortOrder: "asc" as const } },
  clinic: {
    select: {
      id: true,
      slug: true,
      nameRu: true,
      nameEn: true,
      logoUrl: true,
      status: true,
      published: true,
    },
  },
} as const;

export function parseSchedule(scheduleJson: string) {
  try {
    const parsed = JSON.parse(scheduleJson);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function parseJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function parsePhones(phone: string, phonesJson?: string | null): string[] {
  const extras = parseJsonArray<string>(phonesJson).filter(Boolean);
  const primary = phone?.trim();
  const list = primary ? [primary, ...extras.filter((p) => p !== primary)] : extras;
  return list;
}

export function serializeService(service: {
  id: string;
  clinicId: string;
  branchId: string | null;
  specialtyId: string;
  canonicalSlug: string | null;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  priceUsd: number | null;
  currency?: string;
  unit?: string;
  specialty?: { id: string; slug: string; nameRu: string; nameEn: string };
}) {
  return {
    id: service.id,
    clinicId: service.clinicId,
    branchId: service.branchId,
    specialtyId: service.specialtyId,
    canonicalSlug: service.canonicalSlug,
    nameEn: service.nameEn,
    nameRu: service.nameRu,
    descriptionEn: service.descriptionEn,
    descriptionRu: service.descriptionRu,
    priceUsd: service.priceUsd,
    currency: service.currency || "UZS",
    unit: service.unit || "",
    specialty: service.specialty ?? null,
  };
}

export function serializeDoctor(doctor: {
  id: string;
  clinicId: string;
  nameEn: string;
  nameRu: string;
  roleEn: string;
  roleRu: string;
  category?: string;
  photoUrl: string | null;
  bioEn: string;
  bioRu: string;
  certsEn?: string;
  certsRu?: string;
  continuingEducationEn?: string;
  continuingEducationRu?: string;
  internationalExperienceEn?: string;
  internationalExperienceRu?: string;
  researchActivityEn?: string;
  researchActivityRu?: string;
  awardsEn?: string;
  awardsRu?: string;
  achievementsEn?: string;
  achievementsRu?: string;
  experienceYears: number | null;
  sortOrder: number;
  specialties?: { specialty: { id: string; slug: string; nameRu: string; nameEn: string } }[];
  branches?: { branchId: string }[];
}) {
  return {
    id: doctor.id,
    clinicId: doctor.clinicId,
    branchIds: doctor.branches?.map((b) => b.branchId) ?? [],
    nameEn: doctor.nameEn,
    nameRu: doctor.nameRu,
    roleEn: doctor.roleEn,
    roleRu: doctor.roleRu,
    category: doctor.category || "",
    photoUrl: doctor.photoUrl,
    bioEn: doctor.bioEn,
    bioRu: doctor.bioRu,
    certsEn: doctor.certsEn || "",
    certsRu: doctor.certsRu || "",
    continuingEducationEn: doctor.continuingEducationEn || "",
    continuingEducationRu: doctor.continuingEducationRu || "",
    internationalExperienceEn: doctor.internationalExperienceEn || "",
    internationalExperienceRu: doctor.internationalExperienceRu || "",
    researchActivityEn: doctor.researchActivityEn || "",
    researchActivityRu: doctor.researchActivityRu || "",
    awardsEn: doctor.awardsEn || "",
    awardsRu: doctor.awardsRu || "",
    achievementsEn: doctor.achievementsEn || "",
    achievementsRu: doctor.achievementsRu || "",
    experienceYears: doctor.experienceYears,
    sortOrder: doctor.sortOrder,
    specialties: doctor.specialties?.map((s) => s.specialty) ?? [],
  };
}

export function serializeBranchSummary(branch: {
  id: string;
  clinicId: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  city: string;
  country?: string | null;
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
  phonesJson?: string | null;
  email: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  website?: string | null;
  instagram?: string | null;
  socialsJson?: string | null;
  descriptionEn: string;
  descriptionRu: string;
  advantagesRu?: string | null;
  featuresRu?: string | null;
  medicalTourism?: boolean;
  medicalTourismInfoRu?: string | null;
  coverUrl: string | null;
  sortOrder: number;
  scheduleJson: string;
  specialties?: { specialty: { id: string; slug: string; nameRu: string; nameEn: string } }[];
  photos?: { id: string; url: string; category: string; altEn?: string; altRu?: string }[];
  _count?: { doctorLinks?: number; doctors?: number; services: number };
}) {
  return {
    id: branch.id,
    clinicId: branch.clinicId,
    slug: branch.slug,
    nameEn: branch.nameEn,
    nameRu: branch.nameRu,
    city: branch.city,
    country: branch.country ?? "Uzbekistan",
    region: branch.region ?? null,
    district: branch.district ?? null,
    street: branch.street ?? null,
    building: branch.building ?? null,
    addressExtra: branch.addressExtra ?? null,
    addressEn: branch.addressEn,
    addressRu: branch.addressRu,
    lat: branch.lat,
    lng: branch.lng,
    phone: branch.phone,
    phones: parsePhones(branch.phone, branch.phonesJson),
    email: branch.email,
    whatsapp: branch.whatsapp ?? null,
    telegram: branch.telegram ?? null,
    website: branch.website ?? null,
    instagram: branch.instagram ?? null,
    socials: parseJsonArray(branch.socialsJson),
    descriptionEn: branch.descriptionEn,
    descriptionRu: branch.descriptionRu,
    advantagesRu: branch.advantagesRu ?? "",
    featuresRu: branch.featuresRu ?? "",
    medicalTourism: branch.medicalTourism ?? false,
    medicalTourismInfoRu: branch.medicalTourismInfoRu ?? "",
    coverUrl: branch.coverUrl,
    sortOrder: branch.sortOrder,
    schedule: parseSchedule(branch.scheduleJson),
    specialties: branch.specialties?.map((s) => s.specialty) ?? [],
    photos: branch.photos ?? [],
    photoCount: branch.photos?.length ?? 0,
    doctorCount: branch._count?.doctorLinks ?? branch._count?.doctors ?? 0,
    serviceCount: branch._count?.services ?? 0,
  };
}

export const DEFAULT_BRANCH_SCHEDULE = JSON.stringify({
  mon: { open: "09:00", close: "18:00" },
  tue: { open: "09:00", close: "18:00" },
  wed: { open: "09:00", close: "18:00" },
  thu: { open: "09:00", close: "18:00" },
  fri: { open: "09:00", close: "18:00" },
  sat: { open: "09:00", close: "14:00" },
  sun: null,
});
