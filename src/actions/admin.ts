"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated, setAdminSession, clearAdminSession, checkAdminPassword } from "@/lib/auth";
import { saveUpload, slugify } from "@/lib/uploads";
import { CITIES } from "@/lib/constants";
import { go } from "@/lib/redirect";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export async function adminLogin(formData: FormData) {
  const locale = ((formData.get("locale") as string) || "en") as "en" | "ru";
  const password = String(formData.get("password") || "");
  if (!checkAdminPassword(password)) {
    return { error: "invalid" as const };
  }
  await setAdminSession();
  go("/admin", locale);
}

export async function adminLogout(formData: FormData) {
  const locale = ((formData.get("locale") as string) || "en") as "en" | "ru";
  await clearAdminSession();
  go("/admin/login", locale);
}

const clinicSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  nameEn: z.string().trim().min(2),
  nameRu: z.string().trim().min(2),
  city: z.enum(CITIES),
  addressEn: z.string().trim().min(4),
  addressRu: z.string().trim().min(4),
  descriptionEn: z.string().trim().min(10),
  descriptionRu: z.string().trim().min(10),
  phone: z.string().trim().min(6),
  email: z.string().trim().email(),
  website: z.string().trim().optional(),
  languages: z.array(z.string()).min(1),
  coverColor: z.string().optional(),
  published: z.boolean(),
  specialtyIds: z.array(z.string()),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  coordinatorName: z.string().optional(),
  coordinatorRoleEn: z.string().optional(),
  coordinatorRoleRu: z.string().optional(),
  responseHours: z.coerce.number().int().min(1).max(168).optional(),
  licenseInfoEn: z.string().optional(),
  licenseInfoRu: z.string().optional(),
  afterRequestEn: z.string().optional(),
  afterRequestRu: z.string().optional(),
});

export async function saveClinic(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const languages = formData.getAll("languages").map(String);
  const specialtyIds = formData.getAll("specialtyIds").map(String);
  const parsed = clinicSchema.safeParse({
    id: id || undefined,
    slug: String(formData.get("slug") || ""),
    nameEn: formData.get("nameEn"),
    nameRu: formData.get("nameRu"),
    city: formData.get("city"),
    addressEn: formData.get("addressEn"),
    addressRu: formData.get("addressRu"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionRu: formData.get("descriptionRu"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: String(formData.get("website") || ""),
    languages,
    coverColor: String(formData.get("coverColor") || "#1B6B6A"),
    published: formData.get("published") === "on",
    specialtyIds,
    whatsapp: String(formData.get("whatsapp") || ""),
    telegram: String(formData.get("telegram") || ""),
    coordinatorName: String(formData.get("coordinatorName") || ""),
    coordinatorRoleEn: String(formData.get("coordinatorRoleEn") || ""),
    coordinatorRoleRu: String(formData.get("coordinatorRoleRu") || ""),
    responseHours: formData.get("responseHours") || 24,
    licenseInfoEn: String(formData.get("licenseInfoEn") || ""),
    licenseInfoRu: String(formData.get("licenseInfoRu") || ""),
    afterRequestEn: String(formData.get("afterRequestEn") || ""),
    afterRequestRu: String(formData.get("afterRequestRu") || ""),
  });
  const locale = ((formData.get("locale") as string) || "en") as "en" | "ru";
  if (!parsed.success) {
    go(id ? `/admin/clinics/${id}?error=invalid` : "/admin/clinics/new?error=invalid", locale);
  }

  const slug =
    parsed.data.slug && parsed.data.slug.length > 1
      ? slugify(parsed.data.slug)
      : slugify(parsed.data.nameEn);

  const taken = await prisma.clinic.findFirst({
    where: { slug, ...(id ? { NOT: { id } } : {}) },
  });
  if (taken) {
    go(id ? `/admin/clinics/${id}?error=slug` : "/admin/clinics/new?error=slug", locale);
  }

  const logoFile = formData.get("logo") as File | null;
  const logoUrl = logoFile && logoFile.size > 0 ? await saveUpload(logoFile) : undefined;

  const data = {
    slug,
    nameEn: parsed.data.nameEn,
    nameRu: parsed.data.nameRu,
    city: parsed.data.city,
    addressEn: parsed.data.addressEn,
    addressRu: parsed.data.addressRu,
    descriptionEn: parsed.data.descriptionEn,
    descriptionRu: parsed.data.descriptionRu,
    phone: parsed.data.phone,
    email: parsed.data.email,
    website: parsed.data.website || null,
    languages: JSON.stringify(parsed.data.languages),
    coverColor: parsed.data.coverColor || "#1B6B6A",
    published: parsed.data.published,
    whatsapp: parsed.data.whatsapp || null,
    telegram: parsed.data.telegram || null,
    coordinatorName: parsed.data.coordinatorName || null,
    coordinatorRoleEn: parsed.data.coordinatorRoleEn || null,
    coordinatorRoleRu: parsed.data.coordinatorRoleRu || null,
    responseHours: parsed.data.responseHours || 24,
    licenseInfoEn: parsed.data.licenseInfoEn || null,
    licenseInfoRu: parsed.data.licenseInfoRu || null,
    afterRequestEn: parsed.data.afterRequestEn || null,
    afterRequestRu: parsed.data.afterRequestRu || null,
    ...(logoUrl ? { logoUrl } : {}),
  };

  const clinic = id
    ? await prisma.clinic.update({ where: { id }, data })
    : await prisma.clinic.create({ data });

  await prisma.clinicSpecialty.deleteMany({ where: { clinicId: clinic.id } });
  if (specialtyIds.length) {
    await prisma.clinicSpecialty.createMany({
      data: specialtyIds.map((specialtyId) => ({
        clinicId: clinic.id,
        specialtyId,
      })),
    });
  }

  const photo = formData.get("photo") as File | null;
  if (photo && photo.size > 0) {
    const url = await saveUpload(photo);
    if (url) {
      const last = await prisma.clinicPhoto.findFirst({
        where: { clinicId: clinic.id },
        orderBy: { sortOrder: "desc" },
      });
      await prisma.clinicPhoto.create({
        data: {
          clinicId: clinic.id,
          url,
          altEn: clinic.nameEn,
          altRu: clinic.nameRu,
          sortOrder: (last?.sortOrder ?? 0) + 1,
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/clinics");
  go(`/admin/clinics/${clinic.id}`, locale);
}

export async function deleteClinic(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const locale = ((formData.get("locale") as string) || "en") as "en" | "ru";
  await prisma.clinic.delete({ where: { id } });
  revalidatePath("/");
  go("/admin/clinics", locale);
}

export async function deletePhoto(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await prisma.clinicPhoto.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function toggleClinicPublished(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const published = formData.get("published") === "true";
  await prisma.clinic.update({ where: { id }, data: { published } });
  revalidatePath("/");
  revalidatePath("/clinics");
}

const specialtySchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  nameEn: z.string().min(2),
  nameRu: z.string().min(2),
  descriptionEn: z.string().min(4),
  descriptionRu: z.string().min(4),
  explanationEn: z.string().min(4),
  explanationRu: z.string().min(4),
  keywords: z.string().min(4),
});

export async function saveSpecialty(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const parsed = specialtySchema.safeParse({
    id: id || undefined,
    slug: slugify(String(formData.get("slug") || formData.get("nameEn") || "")),
    nameEn: formData.get("nameEn"),
    nameRu: formData.get("nameRu"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionRu: formData.get("descriptionRu"),
    explanationEn: formData.get("explanationEn"),
    explanationRu: formData.get("explanationRu"),
    keywords: formData.get("keywords"),
  });
  if (!parsed.success) return;
  if (id) {
    await prisma.specialty.update({ where: { id }, data: parsed.data });
  } else {
    const last = await prisma.specialty.aggregate({ _max: { sortOrder: true } });
    await prisma.specialty.create({
      data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
    });
  }
  revalidatePath("/");
}

export async function deleteSpecialty(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await prisma.specialty.delete({ where: { id } });
  revalidatePath("/");
}

const serviceSchema = z.object({
  id: z.string().optional(),
  clinicId: z.string().min(1),
  specialtyId: z.string().min(1),
  nameEn: z.string().min(2),
  nameRu: z.string().min(2),
  descriptionEn: z.string().min(4),
  descriptionRu: z.string().min(4),
    canonicalSlug: z.string().optional(),
    priceUsd: z.string().optional(),
  });

export async function saveService(formData: FormData) {
  await requireAdmin();
  const parsed = serviceSchema.safeParse({
    id: String(formData.get("id") || "") || undefined,
    clinicId: formData.get("clinicId"),
    specialtyId: formData.get("specialtyId"),
    nameEn: formData.get("nameEn"),
    nameRu: formData.get("nameRu"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionRu: formData.get("descriptionRu"),
    canonicalSlug: String(formData.get("canonicalSlug") || "") || undefined,
    priceUsd: String(formData.get("priceUsd") || ""),
  });
  if (!parsed.success) return;
  const priceUsd = parsed.data.priceUsd ? Number(parsed.data.priceUsd) : null;
  const data = {
    clinicId: parsed.data.clinicId,
    specialtyId: parsed.data.specialtyId,
    nameEn: parsed.data.nameEn,
    nameRu: parsed.data.nameRu,
    descriptionEn: parsed.data.descriptionEn,
    descriptionRu: parsed.data.descriptionRu,
    canonicalSlug: parsed.data.canonicalSlug || null,
    priceUsd: Number.isFinite(priceUsd) ? priceUsd : null,
  };
  if (parsed.data.id) {
    await prisma.service.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.service.create({ data });
  }
  revalidatePath("/");
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await prisma.service.delete({ where: { id } });
  revalidatePath("/");
}

export async function updateLeadStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  if (!["new", "contacted", "closed"].includes(status)) return;
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/admin/leads");
}
