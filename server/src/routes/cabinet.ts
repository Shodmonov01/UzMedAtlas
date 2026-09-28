import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { z } from "zod";
import {
  clearClinicSession,
  ensureSessionId,
  getClinicOwnerId,
  hashPassword,
  isClinicAuthenticated,
  setClinicSession,
  verifyPassword,
} from "../lib/auth";
import { PHOTO_CATEGORIES, SERVICE_LANGUAGES } from "../lib/constants";
import { prisma } from "../lib/db";
import { parseLanguages } from "../lib/format";
import { checkRateLimit } from "../lib/rate-limit";
import { slugify, validateClinicForModeration } from "../lib/clinic-workflow";
import {
  branchDetailInclude,
  clinicDetailInclude,
  parseJsonArray,
  parsePhones,
  parseSchedule,
  serializeBranchSummary,
  serializeDoctor,
  serializeService,
} from "../lib/clinic-serialize";
import { saveUploadBuffer } from "../lib/uploads";

const withIds = <T extends { id?: string }>(items: T[] | undefined) =>
  (items || []).map((item) => ({
    ...item,
    id: item.id || `id_${Math.random().toString(36).slice(2, 10)}`,
  }));

const ownerRegisterSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(120),
  name: z.string().trim().min(2).max(120),
});

const ownerLoginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(120),
});
const clinicBodySchema = z.object({
  nameRu: z.string().trim().min(2).max(200),
  nameEn: z.string().trim().min(2).max(200),
  shortName: z.string().trim().max(120).optional().nullable(),
  foundedYear: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  slug: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(80),
  addressRu: z.string().trim().min(3).max(300),
  addressEn: z.string().trim().min(3).max(300),
  descriptionRu: z.string().trim().min(10).max(5000),
  descriptionEn: z.string().trim().min(10).max(5000),
  historyRu: z.string().trim().max(8000).optional().nullable(),
  historyEn: z.string().trim().max(8000).optional().nullable(),
  missionRu: z.string().trim().max(4000).optional().nullable(),
  missionEn: z.string().trim().max(4000).optional().nullable(),
  advantagesRu: z.string().trim().max(4000).optional().nullable(),
  advantagesEn: z.string().trim().max(4000).optional().nullable(),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(120),
  website: z.string().trim().max(200).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  telegram: z.string().trim().max(40).optional().nullable(),
  instagram: z.string().trim().max(80).optional().nullable(),
  youtube: z.string().trim().max(200).optional().nullable(),
  socials: z
    .array(z.object({ label: z.string().trim().max(40), url: z.string().trim().max(300) }))
    .max(10)
    .optional(),
  languages: z.array(z.enum(SERVICE_LANGUAGES)).min(1).default(["ru", "en"]),
  coverColor: z.string().trim().max(20).optional(),
  logoUrl: z.string().trim().max(500).optional().nullable(),
  specialtyIds: z.array(z.string().min(1)).default([]),
  founderName: z.string().trim().max(120).optional().nullable(),
  founderRoleRu: z.string().trim().max(120).optional().nullable(),
  founderRoleEn: z.string().trim().max(120).optional().nullable(),
  founderBioRu: z.string().trim().max(4000).optional().nullable(),
  founderBioEn: z.string().trim().max(4000).optional().nullable(),
  founderPhotoUrl: z.string().trim().max(500).optional().nullable(),
  achievements: z
    .array(
      z.object({
        id: z.string().optional(),
        titleRu: z.string().trim().max(200),
        titleEn: z.string().trim().max(200).optional(),
        descriptionRu: z.string().trim().max(1000).optional(),
        descriptionEn: z.string().trim().max(1000).optional(),
        year: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
      }),
    )
    .max(40)
    .optional(),
  leaders: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(2).max(120),
        roleRu: z.string().trim().max(120).optional(),
        roleEn: z.string().trim().max(120).optional(),
        bioRu: z.string().trim().max(2000).optional(),
        bioEn: z.string().trim().max(2000).optional(),
        photoUrl: z.string().trim().max(500).optional().nullable(),
      }),
    )
    .max(20)
    .optional(),
  technologies: z
    .array(
      z.object({
        id: z.string().optional(),
        nameRu: z.string().trim().min(2).max(200),
        nameEn: z.string().trim().max(200).optional(),
        descriptionRu: z.string().trim().max(2000).optional(),
        descriptionEn: z.string().trim().max(2000).optional(),
      }),
    )
    .max(40)
    .optional(),
  coordinatorName: z.string().trim().max(120).optional().nullable(),
  coordinatorRoleRu: z.string().trim().max(120).optional().nullable(),
  coordinatorRoleEn: z.string().trim().max(120).optional().nullable(),
  chiefDoctorName: z.string().trim().max(120).optional().nullable(),
  chiefDoctorRoleRu: z.string().trim().max(120).optional().nullable(),
  chiefDoctorRoleEn: z.string().trim().max(120).optional().nullable(),
  chiefDoctorPhotoUrl: z.string().trim().max(500).optional().nullable(),
  chiefDoctorBioRu: z.string().trim().max(4000).optional().nullable(),
  chiefDoctorBioEn: z.string().trim().max(4000).optional().nullable(),
  responseHours: z.coerce.number().int().min(1).max(168).optional(),
  whyChooseRu: z.string().trim().max(4000).optional().nullable(),
  whyChooseEn: z.string().trim().max(4000).optional().nullable(),
  popularServicesRu: z.string().trim().max(4000).optional().nullable(),
  popularServicesEn: z.string().trim().max(4000).optional().nullable(),
  developmentPlansRu: z.string().trim().max(4000).optional().nullable(),
  developmentPlansEn: z.string().trim().max(4000).optional().nullable(),
  medicalTourism: z.boolean().optional(),
  medicalTourismRu: z.string().trim().max(4000).optional().nullable(),
  medicalTourismEn: z.string().trim().max(4000).optional().nullable(),
});

const clinicPatchSchema = clinicBodySchema.partial().extend({
  specialtyIds: z.array(z.string().min(1)).optional(),
  languages: z.array(z.enum(SERVICE_LANGUAGES)).min(1).optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeClinic(clinic: any) {
  return {
    id: clinic.id,
    slug: clinic.slug,
    nameEn: clinic.nameEn,
    nameRu: clinic.nameRu,
    shortName: clinic.shortName,
    foundedYear: clinic.foundedYear,
    city: clinic.city,
    addressEn: clinic.addressEn,
    addressRu: clinic.addressRu,
    descriptionEn: clinic.descriptionEn,
    descriptionRu: clinic.descriptionRu,
    historyEn: clinic.historyEn,
    historyRu: clinic.historyRu,
    missionEn: clinic.missionEn,
    missionRu: clinic.missionRu,
    advantagesEn: clinic.advantagesEn,
    advantagesRu: clinic.advantagesRu,
    phone: clinic.phone,
    email: clinic.email,
    website: clinic.website,
    whatsapp: clinic.whatsapp,
    telegram: clinic.telegram,
    instagram: clinic.instagram,
    youtube: clinic.youtube ?? null,
    socials: parseJsonArray(clinic.socialsJson),
    languages: parseLanguages(clinic.languages),
    logoUrl: clinic.logoUrl,
    coverColor: clinic.coverColor,
    status: clinic.status,
    moderatorNote: clinic.moderatorNote,
    published: clinic.published,
    founderName: clinic.founderName ?? null,
    founderRoleEn: clinic.founderRoleEn ?? null,
    founderRoleRu: clinic.founderRoleRu ?? null,
    founderBioEn: clinic.founderBioEn ?? null,
    founderBioRu: clinic.founderBioRu ?? null,
    founderPhotoUrl: clinic.founderPhotoUrl ?? null,
    achievements: parseJsonArray(clinic.achievementsJson),
    leaders: parseJsonArray(clinic.leadersJson),
    technologies: parseJsonArray(clinic.technologiesJson),
    coordinatorName: clinic.coordinatorName,
    coordinatorRoleEn: clinic.coordinatorRoleEn,
    coordinatorRoleRu: clinic.coordinatorRoleRu,
    chiefDoctorName: clinic.chiefDoctorName,
    chiefDoctorRoleEn: clinic.chiefDoctorRoleEn,
    chiefDoctorRoleRu: clinic.chiefDoctorRoleRu,
    chiefDoctorPhotoUrl: clinic.chiefDoctorPhotoUrl,
    chiefDoctorBioEn: clinic.chiefDoctorBioEn ?? null,
    chiefDoctorBioRu: clinic.chiefDoctorBioRu ?? null,
    responseHours: clinic.responseHours,
    whyChooseEn: clinic.whyChooseEn,
    whyChooseRu: clinic.whyChooseRu,
    popularServicesEn: clinic.popularServicesEn,
    popularServicesRu: clinic.popularServicesRu,
    developmentPlansEn: clinic.developmentPlansEn,
    developmentPlansRu: clinic.developmentPlansRu,
    medicalTourism: clinic.medicalTourism,
    medicalTourismEn: clinic.medicalTourismEn,
    medicalTourismRu: clinic.medicalTourismRu,
    updatedAt: clinic.updatedAt,
    createdAt: clinic.createdAt,
    specialtyIds: clinic.specialties?.map((s: { specialtyId: string }) => s.specialtyId) ?? [],
    specialties:
      clinic.specialties
        ?.map((s: { specialty?: { id: string; slug: string; nameRu: string; nameEn: string } }) => s.specialty)
        .filter(Boolean) ?? [],
    photos: clinic.photos ?? [],
    doctors: (clinic.doctors ?? []).map(serializeDoctor),
    equipment: clinic.equipment ?? [],
    certificates: clinic.certificates ?? [],
    branchCount: clinic._count?.branches ?? clinic.branches?.length ?? 0,
    doctorCount: clinic._count?.doctors ?? clinic.doctors?.length ?? 0,
    branches: clinic.branches?.map(serializeBranchSummary),
  };
}

async function uniqueSlug(base: string, excludeId?: string) {
  let candidate = slugify(base);
  let i = 0;
  while (true) {
    const existing = await prisma.clinic.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    i += 1;
    candidate = `${slugify(base)}-${i}`;
  }
}

async function requireClinicEditable(request: Parameters<typeof getClinicOwnerId>[0], id: string) {
  const ownerId = getClinicOwnerId(request);
  if (!ownerId) return { error: "unauthorized" as const };
  const existing = await prisma.clinic.findFirst({ where: { id, ownerId } });
  if (!existing) return { error: "not_found" as const };
  if (existing.status === "moderation") return { error: "locked_on_moderation" as const, existing };
  return { existing, ownerId };
}

async function requireClinicOwned(request: Parameters<typeof getClinicOwnerId>[0], id: string) {
  const ownerId = getClinicOwnerId(request);
  if (!ownerId) return { error: "unauthorized" as const };
  const existing = await prisma.clinic.findFirst({ where: { id, ownerId } });
  if (!existing) return { error: "not_found" as const };
  return { existing, ownerId };
}

function draftStatusAfterEdit(status: string) {
  if (status === "published" || status === "approved" || status === "needs_changes") return "draft";
  return status;
}

export async function cabinetRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  app.post("/api/cabinet/register", async (request, reply) => {
    const sessionId = ensureSessionId(request, reply);
    const limited = checkRateLimit(`cabinet-reg:${sessionId}`, 5, 15 * 60 * 1000);
    if (!limited.ok) return reply.code(429).send({ error: "rate_limit" });

    const body = ownerRegisterSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "invalid_payload", details: body.error.flatten() });
    }

    const email = body.data.email.toLowerCase();
    const exists = await prisma.clinicOwner.findUnique({ where: { email } });
    if (exists) return reply.code(409).send({ error: "email_taken" });

    const owner = await prisma.clinicOwner.create({
      data: {
        email,
        name: body.data.name,
        passwordHash: hashPassword(body.data.password),
      },
    });
    setClinicSession(reply, owner.id);
    return { ok: true, owner: { id: owner.id, email: owner.email, name: owner.name } };
  });

  app.post("/api/cabinet/login", async (request, reply) => {
    const sessionId = ensureSessionId(request, reply);
    const limited = checkRateLimit(`cabinet:${sessionId}`, 8, 15 * 60 * 1000);
    if (!limited.ok) return reply.code(429).send({ error: "rate_limit" });

    const body = ownerLoginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "invalid_payload" });
    }

    const owner = await prisma.clinicOwner.findUnique({
      where: { email: body.data.email.toLowerCase() },
    });
    if (!owner || !verifyPassword(body.data.password, owner.passwordHash)) {
      return reply.code(401).send({ error: "invalid" });
    }
    setClinicSession(reply, owner.id);
    return { ok: true, owner: { id: owner.id, email: owner.email, name: owner.name } };
  });

  app.post("/api/cabinet/logout", async (_request, reply) => {
    clearClinicSession(reply);
    return { ok: true };
  });

  app.get("/api/cabinet/me", async (request, reply) => {
    const ownerId = getClinicOwnerId(request);
    if (!ownerId) {
      return reply.code(401).send({ authenticated: false });
    }
    const owner = await prisma.clinicOwner.findUnique({ where: { id: ownerId } });
    if (!owner) {
      clearClinicSession(reply);
      return reply.code(401).send({ authenticated: false });
    }
    return {
      authenticated: true,
      owner: { id: owner.id, email: owner.email, name: owner.name },
    };
  });
  app.post("/api/cabinet/upload", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const file = await request.file();
    if (!file) return reply.code(400).send({ error: "no_file" });
    const buffer = await file.toBuffer();
    const purpose = file.fields.purpose;
    const isLogo = !Array.isArray(purpose) && purpose !== undefined &&
      "value" in purpose && purpose.value === "logo";
    if (isLogo && buffer.byteLength > 2 * 1024 * 1024) {
      return reply.code(413).send({ error: "logo_too_large", maxBytes: 2 * 1024 * 1024 });
    }
    try {
      const url = await saveUploadBuffer(buffer, file.mimetype, "uploads");
      return { url };
    } catch {
      return reply.code(400).send({ error: "unsupported_type" });
    }
  });

  app.get("/api/cabinet/clinics", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const ownerId = getClinicOwnerId(request)!;
    const clinics = await prisma.clinic.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
      include: {
        specialties: { include: { specialty: true } },
        _count: { select: { branches: true, doctors: true, leads: true } },
      },
    });
    return { items: clinics.map(serializeClinic) };
  });

  app.get("/api/cabinet/clinics/:id", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const gate = await requireClinicOwned(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: clinicDetailInclude,
    });
    if (!clinic) return reply.code(404).send({ error: "not_found" });
    return serializeClinic(clinic);
  });

  app.get("/api/cabinet/clinics/:id/branches", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const gate = await requireClinicOwned(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    const branches = await prisma.branch.findMany({
      where: { clinicId: id },
      orderBy: { sortOrder: "asc" },
      include: {
        specialties: { include: { specialty: true } },
        photos: { orderBy: { sortOrder: "asc" } },
        _count: { select: { doctorLinks: true, services: true } },
      },
    });
    return { items: branches.map(serializeBranchSummary) };
  });

  app.get("/api/cabinet/clinics/:id/branches/:branchId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id, branchId } = request.params as { id: string; branchId: string };
    const gate = await requireClinicOwned(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: id },
      include: branchDetailInclude,
    });
    if (!branch) return reply.code(404).send({ error: "not_found" });
    return serializeBranchDetail(branch);
  });

  app.post("/api/cabinet/clinics", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const ownerId = getClinicOwnerId(request)!;
    const parsed = clinicBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
    }
    const data = parsed.data;
    const slug = await uniqueSlug(data.slug || data.nameEn || data.nameRu);

    const clinic = await prisma.clinic.create({
      data: {
        ownerId,
        slug,
        nameEn: data.nameEn,
        nameRu: data.nameRu,
        shortName: data.shortName || null,
        foundedYear: data.foundedYear ?? null,
        city: data.city,
        addressEn: data.addressEn,
        addressRu: data.addressRu,
        descriptionEn: data.descriptionEn,
        descriptionRu: data.descriptionRu,
        historyEn: data.historyEn || null,
        historyRu: data.historyRu || null,
        missionEn: data.missionEn || null,
        missionRu: data.missionRu || null,
        advantagesEn: data.advantagesEn || null,
        advantagesRu: data.advantagesRu || null,
        phone: data.phone,
        email: data.email,
        website: data.website || null,
        whatsapp: data.whatsapp || null,
        telegram: data.telegram || null,
        instagram: data.instagram || null,
        youtube: data.youtube || null,
        socialsJson: JSON.stringify(data.socials || []),
        languages: JSON.stringify(data.languages),
        coverColor: data.coverColor || "#1570ef",
        logoUrl: data.logoUrl || null,
        founderName: data.founderName || null,
        founderRoleEn: data.founderRoleEn || null,
        founderRoleRu: data.founderRoleRu || null,
        founderBioEn: data.founderBioEn || null,
        founderBioRu: data.founderBioRu || null,
        founderPhotoUrl: data.founderPhotoUrl || null,
        achievementsJson: JSON.stringify(withIds(data.achievements)),
        leadersJson: JSON.stringify(withIds(data.leaders)),
        technologiesJson: JSON.stringify(withIds(data.technologies)),
        coordinatorName: data.coordinatorName || null,
        coordinatorRoleEn: data.coordinatorRoleEn || null,
        coordinatorRoleRu: data.coordinatorRoleRu || null,
        chiefDoctorName: data.chiefDoctorName || null,
        chiefDoctorRoleEn: data.chiefDoctorRoleEn || null,
        chiefDoctorRoleRu: data.chiefDoctorRoleRu || null,
        chiefDoctorPhotoUrl: data.chiefDoctorPhotoUrl || null,
        chiefDoctorBioEn: data.chiefDoctorBioEn || null,
        chiefDoctorBioRu: data.chiefDoctorBioRu || null,
        responseHours: data.responseHours ?? 24,
        whyChooseEn: data.whyChooseEn || null,
        whyChooseRu: data.whyChooseRu || null,
        popularServicesEn: data.popularServicesEn || null,
        popularServicesRu: data.popularServicesRu || null,
        developmentPlansEn: data.developmentPlansEn || null,
        developmentPlansRu: data.developmentPlansRu || null,
        medicalTourism: data.medicalTourism ?? false,
        medicalTourismEn: data.medicalTourismEn || null,
        medicalTourismRu: data.medicalTourismRu || null,
        status: "draft",
        published: false,
        moderatorNote: null,
        specialties: {
          create: data.specialtyIds.map((specialtyId) => ({ specialtyId })),
        },
      },
      include: clinicDetailInclude,
    });

    return reply.code(201).send(serializeClinic(clinic));
  });

  app.put("/api/cabinet/clinics/:id", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const existing = gate.existing!;

    const parsed = clinicPatchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
    }
    const data = parsed.data;
    const slug = data.slug ? await uniqueSlug(data.slug, id) : existing.slug;
    const nextStatus = draftStatusAfterEdit(existing.status);

    const clinic = await prisma.$transaction(async (tx) => {
      if (data.specialtyIds) {
        await tx.clinicSpecialty.deleteMany({ where: { clinicId: id } });
      }
      return tx.clinic.update({
        where: { id },
        data: {
          slug,
          ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
          ...(data.nameRu !== undefined ? { nameRu: data.nameRu } : {}),
          ...(data.shortName !== undefined ? { shortName: data.shortName } : {}),
          ...(data.foundedYear !== undefined ? { foundedYear: data.foundedYear } : {}),
          ...(data.city !== undefined ? { city: data.city } : {}),
          ...(data.addressEn !== undefined ? { addressEn: data.addressEn } : {}),
          ...(data.addressRu !== undefined ? { addressRu: data.addressRu } : {}),
          ...(data.descriptionEn !== undefined ? { descriptionEn: data.descriptionEn } : {}),
          ...(data.descriptionRu !== undefined ? { descriptionRu: data.descriptionRu } : {}),
          ...(data.historyEn !== undefined ? { historyEn: data.historyEn } : {}),
          ...(data.historyRu !== undefined ? { historyRu: data.historyRu } : {}),
          ...(data.missionEn !== undefined ? { missionEn: data.missionEn } : {}),
          ...(data.missionRu !== undefined ? { missionRu: data.missionRu } : {}),
          ...(data.advantagesEn !== undefined ? { advantagesEn: data.advantagesEn } : {}),
          ...(data.advantagesRu !== undefined ? { advantagesRu: data.advantagesRu } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.email !== undefined ? { email: data.email } : {}),
          ...(data.website !== undefined ? { website: data.website } : {}),
          ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
          ...(data.telegram !== undefined ? { telegram: data.telegram } : {}),
          ...(data.instagram !== undefined ? { instagram: data.instagram } : {}),
          ...(data.youtube !== undefined ? { youtube: data.youtube } : {}),
          ...(data.socials !== undefined ? { socialsJson: JSON.stringify(data.socials) } : {}),
          ...(data.languages !== undefined ? { languages: JSON.stringify(data.languages) } : {}),
          ...(data.coverColor !== undefined ? { coverColor: data.coverColor } : {}),
          ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
          ...(data.founderName !== undefined ? { founderName: data.founderName } : {}),
          ...(data.founderRoleEn !== undefined ? { founderRoleEn: data.founderRoleEn } : {}),
          ...(data.founderRoleRu !== undefined ? { founderRoleRu: data.founderRoleRu } : {}),
          ...(data.founderBioEn !== undefined ? { founderBioEn: data.founderBioEn } : {}),
          ...(data.founderBioRu !== undefined ? { founderBioRu: data.founderBioRu } : {}),
          ...(data.founderPhotoUrl !== undefined ? { founderPhotoUrl: data.founderPhotoUrl } : {}),
          ...(data.achievements !== undefined
            ? { achievementsJson: JSON.stringify(withIds(data.achievements)) }
            : {}),
          ...(data.leaders !== undefined ? { leadersJson: JSON.stringify(withIds(data.leaders)) } : {}),
          ...(data.technologies !== undefined
            ? { technologiesJson: JSON.stringify(withIds(data.technologies)) }
            : {}),
          ...(data.coordinatorName !== undefined ? { coordinatorName: data.coordinatorName } : {}),
          ...(data.coordinatorRoleEn !== undefined ? { coordinatorRoleEn: data.coordinatorRoleEn } : {}),
          ...(data.coordinatorRoleRu !== undefined ? { coordinatorRoleRu: data.coordinatorRoleRu } : {}),
          ...(data.chiefDoctorName !== undefined ? { chiefDoctorName: data.chiefDoctorName } : {}),
          ...(data.chiefDoctorRoleEn !== undefined ? { chiefDoctorRoleEn: data.chiefDoctorRoleEn } : {}),
          ...(data.chiefDoctorRoleRu !== undefined ? { chiefDoctorRoleRu: data.chiefDoctorRoleRu } : {}),
          ...(data.chiefDoctorPhotoUrl !== undefined
            ? { chiefDoctorPhotoUrl: data.chiefDoctorPhotoUrl }
            : {}),
          ...(data.chiefDoctorBioEn !== undefined ? { chiefDoctorBioEn: data.chiefDoctorBioEn } : {}),
          ...(data.chiefDoctorBioRu !== undefined ? { chiefDoctorBioRu: data.chiefDoctorBioRu } : {}),
          ...(data.responseHours !== undefined ? { responseHours: data.responseHours } : {}),
          ...(data.whyChooseEn !== undefined ? { whyChooseEn: data.whyChooseEn } : {}),
          ...(data.whyChooseRu !== undefined ? { whyChooseRu: data.whyChooseRu } : {}),
          ...(data.popularServicesEn !== undefined ? { popularServicesEn: data.popularServicesEn } : {}),
          ...(data.popularServicesRu !== undefined ? { popularServicesRu: data.popularServicesRu } : {}),
          ...(data.developmentPlansEn !== undefined
            ? { developmentPlansEn: data.developmentPlansEn }
            : {}),
          ...(data.developmentPlansRu !== undefined
            ? { developmentPlansRu: data.developmentPlansRu }
            : {}),
          ...(data.medicalTourism !== undefined ? { medicalTourism: data.medicalTourism } : {}),
          ...(data.medicalTourismEn !== undefined ? { medicalTourismEn: data.medicalTourismEn } : {}),
          ...(data.medicalTourismRu !== undefined ? { medicalTourismRu: data.medicalTourismRu } : {}),
          status: nextStatus,
          published: false,
          ...(data.specialtyIds
            ? { specialties: { create: data.specialtyIds.map((specialtyId) => ({ specialtyId })) } }
            : {}),
        },
        include: clinicDetailInclude,
      });
    });

    return serializeClinic(clinic);
  });

  app.delete("/api/cabinet/clinics/:id", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const existing = await prisma.clinic.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "not_found" });
    if (existing.status === "moderation" || existing.status === "published") {
      return reply.code(409).send({ error: "cannot_delete" });
    }
    await prisma.clinic.delete({ where: { id } });
    return { ok: true };
  });

  app.post("/api/cabinet/clinics/:id/submit", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: { specialties: true, branches: { include: { specialties: true } } },
    });
    if (!clinic) return reply.code(404).send({ error: "not_found" });
    if (!["draft", "needs_changes"].includes(clinic.status)) {
      return reply.code(409).send({ error: "invalid_status", status: clinic.status });
    }

    const issues = validateClinicForModeration(clinic);
    if (issues.length) {
      return reply.code(400).send({ error: "validation", issues });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.moderationLog.create({
        data: { clinicId: id, action: "submit", note: null },
      });
      return tx.clinic.update({
        where: { id },
        data: {
          status: "moderation",
          published: false,
          moderatorNote: null,
        },
        include: clinicDetailInclude,
      });
    });
    return serializeClinic(updated);
  });

  // --- Photos ---
  app.post("/api/cabinet/clinics/:id/photos", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const body = z
      .object({
        url: z.string().min(1),
        category: z.enum(PHOTO_CATEGORIES).default("other"),
        altRu: z.string().max(200).optional(),
        altEn: z.string().max(200).optional(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const count = await prisma.clinicPhoto.count({ where: { clinicId: id } });
    const photo = await prisma.clinicPhoto.create({
      data: {
        clinicId: id,
        url: body.data.url,
        category: body.data.category,
        altRu: body.data.altRu || "",
        altEn: body.data.altEn || "",
        sortOrder: count + 1,
      },
    });
    return reply.code(201).send(photo);
  });

  app.delete("/api/cabinet/clinics/:id/photos/:photoId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, photoId } = request.params as { id: string; photoId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    await prisma.clinicPhoto.deleteMany({ where: { id: photoId, clinicId: id } });
    return { ok: true };
  });

  app.put("/api/cabinet/clinics/:id/photos/reorder", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const body = z.object({ photoIds: z.array(z.string().min(1)).min(1) }).safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const existing = await prisma.clinicPhoto.findMany({
      where: { clinicId: id },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((p) => p.id));
    if (
      body.data.photoIds.length !== existingIds.size ||
      body.data.photoIds.some((pid) => !existingIds.has(pid))
    ) {
      return reply.code(400).send({ error: "invalid_photo_ids" });
    }
    await prisma.$transaction(
      body.data.photoIds.map((photoId, index) =>
        prisma.clinicPhoto.update({
          where: { id: photoId },
          data: { sortOrder: index },
        }),
      ),
    );
    const items = await prisma.clinicPhoto.findMany({
      where: { clinicId: id },
      orderBy: { sortOrder: "asc" },
    });
    return { items };
  });

  app.post("/api/cabinet/clinics/:id/photos/:photoId/main", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, photoId } = request.params as { id: string; photoId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const photos = await prisma.clinicPhoto.findMany({
      where: { clinicId: id },
      orderBy: { sortOrder: "asc" },
    });
    if (!photos.some((p) => p.id === photoId)) {
      return reply.code(404).send({ error: "not_found" });
    }
    const ordered = [photoId, ...photos.filter((p) => p.id !== photoId).map((p) => p.id)];
    await prisma.$transaction(
      ordered.map((pid, index) =>
        prisma.clinicPhoto.update({
          where: { id: pid },
          data: { sortOrder: index },
        }),
      ),
    );
    const items = await prisma.clinicPhoto.findMany({
      where: { clinicId: id },
      orderBy: { sortOrder: "asc" },
    });
    return { items };
  });

  app.patch("/api/cabinet/clinics/:id/photos/:photoId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, photoId } = request.params as { id: string; photoId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const body = z
      .object({
        url: z.string().min(1).optional(),
        category: z.enum(PHOTO_CATEGORIES).optional(),
        altRu: z.string().max(200).optional(),
        altEn: z.string().max(200).optional(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const existing = await prisma.clinicPhoto.findFirst({ where: { id: photoId, clinicId: id } });
    if (!existing) return reply.code(404).send({ error: "not_found" });
    const photo = await prisma.clinicPhoto.update({
      where: { id: photoId },
      data: {
        ...(body.data.url !== undefined ? { url: body.data.url } : {}),
        ...(body.data.category !== undefined ? { category: body.data.category } : {}),
        ...(body.data.altRu !== undefined ? { altRu: body.data.altRu } : {}),
        ...(body.data.altEn !== undefined ? { altEn: body.data.altEn } : {}),
      },
    });
    return photo;
  });

  // --- Doctors ---
  app.post("/api/cabinet/clinics/:id/doctors", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(120),
        nameEn: z.string().trim().min(2).max(120),
        roleRu: z.string().trim().max(120).optional(),
        roleEn: z.string().trim().max(120).optional(),
        bioRu: z.string().trim().max(2000).optional(),
        bioEn: z.string().trim().max(2000).optional(),
        category: z.string().trim().max(40).optional(),
        certsRu: z.string().trim().max(2000).optional(),
        certsEn: z.string().trim().max(2000).optional(),
        continuingEducationRu: z.string().trim().max(3000).optional(),
        continuingEducationEn: z.string().trim().max(3000).optional(),
        internationalExperienceRu: z.string().trim().max(3000).optional(),
        internationalExperienceEn: z.string().trim().max(3000).optional(),
        researchActivityRu: z.string().trim().max(3000).optional(),
        researchActivityEn: z.string().trim().max(3000).optional(),
        awardsRu: z.string().trim().max(3000).optional(),
        awardsEn: z.string().trim().max(3000).optional(),
        achievementsRu: z.string().trim().max(3000).optional(),
        achievementsEn: z.string().trim().max(3000).optional(),
        photoUrl: z.string().max(500).optional().nullable(),
        experienceYears: z.coerce.number().int().min(0).max(80).optional().nullable(),
        specialtyIds: z.array(z.string()).default([]),
        branchIds: z.array(z.string()).default([]),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    if (body.data.branchIds.length) {
      const owned = await prisma.branch.count({
        where: { clinicId: id, id: { in: body.data.branchIds } },
      });
      if (owned !== body.data.branchIds.length) {
        return reply.code(400).send({ error: "invalid_branch_ids" });
      }
    }

    const doctor = await prisma.doctor.create({
      data: {
        clinicId: id,
        nameRu: body.data.nameRu,
        nameEn: body.data.nameEn,
        roleRu: body.data.roleRu || "",
        roleEn: body.data.roleEn || "",
        category: body.data.category || "",
        bioRu: body.data.bioRu || "",
        bioEn: body.data.bioEn || "",
        certsRu: body.data.certsRu || "",
        certsEn: body.data.certsEn || "",
        continuingEducationRu: body.data.continuingEducationRu || "",
        continuingEducationEn: body.data.continuingEducationEn || "",
        internationalExperienceRu: body.data.internationalExperienceRu || "",
        internationalExperienceEn: body.data.internationalExperienceEn || "",
        researchActivityRu: body.data.researchActivityRu || "",
        researchActivityEn: body.data.researchActivityEn || "",
        awardsRu: body.data.awardsRu || "",
        awardsEn: body.data.awardsEn || "",
        achievementsRu: body.data.achievementsRu || "",
        achievementsEn: body.data.achievementsEn || "",
        photoUrl: body.data.photoUrl || null,
        experienceYears: body.data.experienceYears ?? null,
        specialties: {
          create: body.data.specialtyIds.map((specialtyId) => ({ specialtyId })),
        },
        branches: {
          create: body.data.branchIds.map((branchId) => ({ branchId })),
        },
      },
      include: { specialties: { include: { specialty: true } }, branches: true },
    });
    return reply.code(201).send(serializeDoctor(doctor));
  });

  app.put("/api/cabinet/clinics/:id/doctors/:doctorId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, doctorId } = request.params as { id: string; doctorId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const existing = await prisma.doctor.findFirst({ where: { id: doctorId, clinicId: id } });
    if (!existing) return reply.code(404).send({ error: "not_found" });

    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(120).optional(),
        nameEn: z.string().trim().min(2).max(120).optional(),
        roleRu: z.string().trim().max(120).optional(),
        roleEn: z.string().trim().max(120).optional(),
        bioRu: z.string().trim().max(2000).optional(),
        bioEn: z.string().trim().max(2000).optional(),
        category: z.string().trim().max(40).optional(),
        certsRu: z.string().trim().max(2000).optional(),
        certsEn: z.string().trim().max(2000).optional(),
        continuingEducationRu: z.string().trim().max(3000).optional(),
        continuingEducationEn: z.string().trim().max(3000).optional(),
        internationalExperienceRu: z.string().trim().max(3000).optional(),
        internationalExperienceEn: z.string().trim().max(3000).optional(),
        researchActivityRu: z.string().trim().max(3000).optional(),
        researchActivityEn: z.string().trim().max(3000).optional(),
        awardsRu: z.string().trim().max(3000).optional(),
        awardsEn: z.string().trim().max(3000).optional(),
        achievementsRu: z.string().trim().max(3000).optional(),
        achievementsEn: z.string().trim().max(3000).optional(),
        photoUrl: z.string().max(500).optional().nullable(),
        experienceYears: z.coerce.number().int().min(0).max(80).optional().nullable(),
        specialtyIds: z.array(z.string()).optional(),
        branchIds: z.array(z.string()).optional(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    if (body.data.branchIds) {
      const owned = await prisma.branch.count({
        where: { clinicId: id, id: { in: body.data.branchIds } },
      });
      if (owned !== body.data.branchIds.length) {
        return reply.code(400).send({ error: "invalid_branch_ids" });
      }
    }

    const doctor = await prisma.$transaction(async (tx) => {
      if (body.data.specialtyIds) {
        await tx.doctorSpecialty.deleteMany({ where: { doctorId } });
        if (body.data.specialtyIds.length) {
          await tx.doctorSpecialty.createMany({
            data: body.data.specialtyIds.map((specialtyId) => ({ doctorId, specialtyId })),
          });
        }
      }
      if (body.data.branchIds) {
        await tx.doctorBranch.deleteMany({ where: { doctorId } });
        if (body.data.branchIds.length) {
          await tx.doctorBranch.createMany({
            data: body.data.branchIds.map((branchId) => ({ doctorId, branchId })),
          });
        }
      }
      return tx.doctor.update({
        where: { id: doctorId },
        data: {
          nameRu: body.data.nameRu,
          nameEn: body.data.nameEn,
          roleRu: body.data.roleRu,
          roleEn: body.data.roleEn,
          category: body.data.category,
          bioRu: body.data.bioRu,
          bioEn: body.data.bioEn,
          certsRu: body.data.certsRu,
          certsEn: body.data.certsEn,
          continuingEducationRu: body.data.continuingEducationRu,
          continuingEducationEn: body.data.continuingEducationEn,
          internationalExperienceRu: body.data.internationalExperienceRu,
          internationalExperienceEn: body.data.internationalExperienceEn,
          researchActivityRu: body.data.researchActivityRu,
          researchActivityEn: body.data.researchActivityEn,
          awardsRu: body.data.awardsRu,
          awardsEn: body.data.awardsEn,
          achievementsRu: body.data.achievementsRu,
          achievementsEn: body.data.achievementsEn,
          photoUrl: body.data.photoUrl === undefined ? undefined : body.data.photoUrl,
          experienceYears:
            body.data.experienceYears === undefined ? undefined : body.data.experienceYears,
        },
        include: { specialties: { include: { specialty: true } }, branches: true },
      });
    });
    return serializeDoctor(doctor);
  });

  app.delete("/api/cabinet/clinics/:id/doctors/:doctorId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, doctorId } = request.params as { id: string; doctorId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    await prisma.doctor.deleteMany({ where: { id: doctorId, clinicId: id } });
    return { ok: true };
  });

  app.put("/api/cabinet/clinics/:id/branches/:branchId/doctors", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId } = request.params as { id: string; branchId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const branch = await prisma.branch.findFirst({ where: { id: branchId, clinicId: id } });
    if (!branch) return reply.code(404).send({ error: "not_found" });

    const body = z.object({ doctorIds: z.array(z.string()) }).safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    if (body.data.doctorIds.length) {
      const owned = await prisma.doctor.count({
        where: { clinicId: id, id: { in: body.data.doctorIds } },
      });
      if (owned !== body.data.doctorIds.length) {
        return reply.code(400).send({ error: "invalid_doctor_ids" });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.doctorBranch.deleteMany({ where: { branchId } });
      if (body.data.doctorIds.length) {
        await tx.doctorBranch.createMany({
          data: body.data.doctorIds.map((doctorId) => ({ doctorId, branchId })),
        });
      }
    });

    const updated = await prisma.branch.findFirst({
      where: { id: branchId },
      include: branchDetailInclude,
    });
    return {
      doctors: (updated?.doctorLinks ?? []).map((link) => serializeDoctor(link.doctor)),
    };
  });

  // --- Branch services ---
  app.post("/api/cabinet/clinics/:id/branches/:branchId/services", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId } = request.params as { id: string; branchId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: id },
      include: { specialties: true },
    });
    if (!branch) return reply.code(404).send({ error: "not_found" });

    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(200),
        nameEn: z.string().trim().min(2).max(200),
        specialtyId: z.string().min(1),
        descriptionRu: z.string().trim().max(2000).optional(),
        descriptionEn: z.string().trim().max(2000).optional(),
        priceUsd: z.coerce.number().int().min(0).optional().nullable(),
        currency: z.enum(["UZS", "USD"]).default("UZS"),
        unit: z.string().trim().max(60).optional(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    const allowed = new Set(branch.specialties.map((s) => s.specialtyId));
    if (!allowed.has(body.data.specialtyId)) {
      return reply.code(400).send({ error: "specialty_not_on_branch" });
    }

    const service = await prisma.service.create({
      data: {
        clinicId: id,
        branchId,
        specialtyId: body.data.specialtyId,
        nameRu: body.data.nameRu,
        nameEn: body.data.nameEn,
        descriptionRu: body.data.descriptionRu || "",
        descriptionEn: body.data.descriptionEn || "",
        priceUsd: body.data.priceUsd ?? null,
        currency: body.data.currency,
        unit: body.data.unit || "",
      },
      include: { specialty: true },
    });
    return reply.code(201).send(serializeService(service));
  });

  app.put("/api/cabinet/clinics/:id/branches/:branchId/services/:serviceId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId, serviceId } = request.params as {
      id: string;
      branchId: string;
      serviceId: string;
    };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }

    const existing = await prisma.service.findFirst({
      where: { id: serviceId, clinicId: id, branchId },
    });
    if (!existing) return reply.code(404).send({ error: "not_found" });

    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(200).optional(),
        nameEn: z.string().trim().min(2).max(200).optional(),
        specialtyId: z.string().min(1).optional(),
        descriptionRu: z.string().trim().max(2000).optional(),
        descriptionEn: z.string().trim().max(2000).optional(),
        priceUsd: z.coerce.number().int().min(0).optional().nullable(),
        currency: z.enum(["UZS", "USD"]).optional(),
        unit: z.string().trim().max(60).optional(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    if (body.data.specialtyId) {
      const link = await prisma.branchSpecialty.findFirst({
        where: { branchId, specialtyId: body.data.specialtyId },
      });
      if (!link) return reply.code(400).send({ error: "specialty_not_on_branch" });
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        nameRu: body.data.nameRu,
        nameEn: body.data.nameEn,
        specialtyId: body.data.specialtyId,
        descriptionRu: body.data.descriptionRu,
        descriptionEn: body.data.descriptionEn,
        priceUsd: body.data.priceUsd === undefined ? undefined : body.data.priceUsd,
        currency: body.data.currency,
        unit: body.data.unit,
      },
      include: { specialty: true },
    });
    return serializeService(service);
  });

  app.delete(
    "/api/cabinet/clinics/:id/branches/:branchId/services/:serviceId",
    async (request, reply) => {
      if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
      const { id, branchId, serviceId } = request.params as {
        id: string;
        branchId: string;
        serviceId: string;
      };
      const gate = await requireClinicEditable(request, id);
      if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
      if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
      if (gate.error === "locked_on_moderation") {
        return reply.code(409).send({ error: "locked_on_moderation" });
      }
      await prisma.service.deleteMany({ where: { id: serviceId, clinicId: id, branchId } });
      return { ok: true };
    },
  );

  // --- Branch equipment ---
  app.post("/api/cabinet/clinics/:id/branches/:branchId/equipment", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId } = request.params as { id: string; branchId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const branch = await prisma.branch.findFirst({ where: { id: branchId, clinicId: id } });
    if (!branch) return reply.code(404).send({ error: "not_found" });

    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(200),
        nameEn: z.string().trim().min(2).max(200),
        manufacturer: z.string().trim().max(200).optional(),
        descriptionRu: z.string().trim().max(2000).optional(),
        descriptionEn: z.string().trim().max(2000).optional(),
        photoUrl: z.string().max(500).optional().nullable(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    const count = await prisma.equipment.count({ where: { branchId } });
    const item = await prisma.equipment.create({
      data: {
        clinicId: id,
        branchId,
        nameRu: body.data.nameRu,
        nameEn: body.data.nameEn,
        manufacturer: body.data.manufacturer || "",
        descriptionRu: body.data.descriptionRu || "",
        descriptionEn: body.data.descriptionEn || "",
        photoUrl: body.data.photoUrl || null,
        sortOrder: count,
      },
    });
    return reply.code(201).send(item);
  });

  app.put("/api/cabinet/clinics/:id/branches/:branchId/equipment/:itemId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId, itemId } = request.params as {
      id: string;
      branchId: string;
      itemId: string;
    };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }

    const existing = await prisma.equipment.findFirst({
      where: { id: itemId, clinicId: id, branchId },
    });
    if (!existing) return reply.code(404).send({ error: "not_found" });

    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(200).optional(),
        nameEn: z.string().trim().min(2).max(200).optional(),
        manufacturer: z.string().trim().max(200).optional(),
        descriptionRu: z.string().trim().max(2000).optional(),
        descriptionEn: z.string().trim().max(2000).optional(),
        photoUrl: z.string().max(500).optional().nullable(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    const item = await prisma.equipment.update({
      where: { id: itemId },
      data: {
        nameRu: body.data.nameRu,
        nameEn: body.data.nameEn,
        manufacturer: body.data.manufacturer,
        descriptionRu: body.data.descriptionRu,
        descriptionEn: body.data.descriptionEn,
        photoUrl: body.data.photoUrl === undefined ? undefined : body.data.photoUrl,
      },
    });
    return item;
  });

  app.delete(
    "/api/cabinet/clinics/:id/branches/:branchId/equipment/:itemId",
    async (request, reply) => {
      if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
      const { id, branchId, itemId } = request.params as {
        id: string;
        branchId: string;
        itemId: string;
      };
      const gate = await requireClinicEditable(request, id);
      if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
      if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
      if (gate.error === "locked_on_moderation") {
        return reply.code(409).send({ error: "locked_on_moderation" });
      }
      await prisma.equipment.deleteMany({ where: { id: itemId, clinicId: id, branchId } });
      return { ok: true };
    },
  );

  // --- Equipment (clinic-level) ---
  app.post("/api/cabinet/clinics/:id/equipment", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(200),
        nameEn: z.string().trim().min(2).max(200),
        manufacturer: z.string().trim().max(200).optional(),
        descriptionRu: z.string().trim().max(2000).optional(),
        descriptionEn: z.string().trim().max(2000).optional(),
        photoUrl: z.string().max(500).optional().nullable(),
        branchId: z.string().optional().nullable(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    let branchId: string | null = body.data.branchId || null;
    if (branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: branchId, clinicId: id } });
      if (!branch) return reply.code(400).send({ error: "invalid_branch_id" });
    }

    const item = await prisma.equipment.create({
      data: {
        clinicId: id,
        branchId,
        nameRu: body.data.nameRu,
        nameEn: body.data.nameEn,
        manufacturer: body.data.manufacturer || "",
        descriptionRu: body.data.descriptionRu || "",
        descriptionEn: body.data.descriptionEn || "",
        photoUrl: body.data.photoUrl || null,
      },
    });
    return reply.code(201).send(item);
  });

  app.delete("/api/cabinet/clinics/:id/equipment/:itemId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, itemId } = request.params as { id: string; itemId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    await prisma.equipment.deleteMany({ where: { id: itemId, clinicId: id } });
    return { ok: true };
  });

  // --- Certificates ---
  app.post("/api/cabinet/clinics/:id/certificates", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(200),
        nameEn: z.string().trim().min(2).max(200),
        issuerRu: z.string().trim().max(200).optional(),
        issuerEn: z.string().trim().max(200).optional(),
        year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
        receivedAt: z.string().trim().max(40).optional().nullable(),
        validUntil: z.string().trim().max(40).optional().nullable(),
        imageUrl: z.string().max(500).optional().nullable(),
        fileUrl: z.string().max(500).optional().nullable(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const item = await prisma.certificate.create({
      data: {
        clinicId: id,
        nameRu: body.data.nameRu,
        nameEn: body.data.nameEn,
        issuerRu: body.data.issuerRu || "",
        issuerEn: body.data.issuerEn || "",
        year: body.data.year ?? null,
        receivedAt: body.data.receivedAt || null,
        validUntil: body.data.validUntil || null,
        imageUrl: body.data.imageUrl || null,
        fileUrl: body.data.fileUrl || null,
      },
    });
    return reply.code(201).send(item);
  });

  app.delete("/api/cabinet/clinics/:id/certificates/:itemId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, itemId } = request.params as { id: string; itemId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    await prisma.certificate.deleteMany({ where: { id: itemId, clinicId: id } });
    return { ok: true };
  });

  // --- Branches CRUD ---
  const daySchema = z
    .object({
      open: z.string().min(1).max(8),
      close: z.string().min(1).max(8),
      roundTheClock: z.boolean().optional(),
      breakStart: z.string().min(1).max(8).nullable().optional(),
      breakEnd: z.string().min(1).max(8).nullable().optional(),
    })
    .nullable();
  const scheduleSchema = z
    .object({
      mon: daySchema.optional(),
      tue: daySchema.optional(),
      wed: daySchema.optional(),
      thu: daySchema.optional(),
      fri: daySchema.optional(),
      sat: daySchema.optional(),
      sun: daySchema.optional(),
    })
    .optional();

  const branchBodySchema = z.object({
    nameRu: z.string().trim().min(2).max(200),
    nameEn: z.string().trim().min(2).max(200),
    slug: z.string().trim().min(2).max(80).optional(),
    city: z.string().trim().min(2).max(80),
    country: z.string().trim().max(80).optional(),
    region: z.string().trim().max(120).optional().nullable(),
    district: z.string().trim().max(120).optional().nullable(),
    street: z.string().trim().max(200).optional().nullable(),
    building: z.string().trim().max(80).optional().nullable(),
    addressExtra: z.string().trim().max(300).optional().nullable(),
    addressRu: z.string().trim().min(3).max(300),
    addressEn: z.string().trim().min(3).max(300),
    lat: z.coerce.number().min(-90).max(90).optional().nullable(),
    lng: z.coerce.number().min(-180).max(180).optional().nullable(),
    phone: z.string().trim().min(5).max(40),
    phones: z.array(z.string().trim().min(5).max(40)).max(8).optional(),
    email: z.string().trim().email().max(120).optional().nullable(),
    whatsapp: z.string().trim().max(40).optional().nullable(),
    telegram: z.string().trim().max(40).optional().nullable(),
    website: z.string().trim().max(200).optional().nullable(),
    instagram: z.string().trim().max(80).optional().nullable(),
    socials: z.array(z.object({ label: z.string().trim().min(1).max(40), url: z.string().trim().max(300) })).max(10).optional(),
    descriptionRu: z.string().trim().max(5000).optional(),
    descriptionEn: z.string().trim().max(5000).optional(),
    advantagesRu: z.string().trim().max(4000).optional(),
    featuresRu: z.string().trim().max(4000).optional(),
    medicalTourism: z.boolean().optional(),
    medicalTourismInfoRu: z.string().trim().max(4000).optional(),
    coverUrl: z.string().trim().max(500).optional().nullable(),
    specialtyIds: z.array(z.string().min(1)).default([]),
    schedule: scheduleSchema,
    sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  });

  async function uniqueBranchSlug(clinicId: string, base: string, excludeId?: string) {
    let candidate = slugify(base);
    let i = 0;
    while (true) {
      const existing = await prisma.branch.findFirst({
        where: {
          clinicId,
          slug: candidate,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (!existing) return candidate;
      i += 1;
      candidate = `${slugify(base)}-${i}`;
    }
  }

  function serializeBranchDetail(branch: {
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
    whatsapp: string | null;
    telegram: string | null;
    website: string | null;
    instagram?: string | null;
    socialsJson?: string;
    descriptionEn: string;
    descriptionRu: string;
    advantagesRu?: string;
    featuresRu?: string;
    medicalTourism?: boolean;
    medicalTourismInfoRu?: string;
    coverUrl: string | null;
    sortOrder: number;
    scheduleJson: string;
    specialties?: { specialtyId: string; specialty: { id: string; slug: string; nameRu: string; nameEn: string } }[];
    photos?: unknown[];
    doctorLinks?: { doctor: Parameters<typeof serializeDoctor>[0] }[];
    doctors?: Parameters<typeof serializeDoctor>[0][];
    services?: Parameters<typeof serializeService>[0][];
    equipment?: unknown[];
    certificates?: unknown[];
    clinic?: unknown;
  }) {
    const doctors = branch.doctorLinks
      ? branch.doctorLinks.map((link) => serializeDoctor(link.doctor))
      : (branch.doctors ?? []).map(serializeDoctor);
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
      whatsapp: branch.whatsapp,
      telegram: branch.telegram,
      website: branch.website,
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
      specialtyIds: branch.specialties?.map((s) => s.specialtyId) ?? [],
      photos: branch.photos ?? [],
      doctors,
      services: (branch.services ?? []).map(serializeService),
      equipment: branch.equipment ?? [],
      certificates: branch.certificates ?? [],
      clinic: branch.clinic,
    };
  }

  app.post("/api/cabinet/clinics/:id/branches", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }

    const parsed = branchBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
    }
    const data = parsed.data;
    const slug = await uniqueBranchSlug(id, data.slug || data.nameEn || data.nameRu);
    const count = await prisma.branch.count({ where: { clinicId: id } });

    // specialtyIds must be subset of clinic specialties when provided
    if (data.specialtyIds.length) {
      const clinicSpecs = await prisma.clinicSpecialty.findMany({
        where: { clinicId: id },
        select: { specialtyId: true },
      });
      const allowed = new Set(clinicSpecs.map((s) => s.specialtyId));
      if (data.specialtyIds.some((sid) => !allowed.has(sid))) {
        return reply.code(400).send({ error: "specialty_not_in_clinic" });
      }
    }

    const branch = await prisma.$transaction(async (tx) => {
      await tx.clinic.update({
        where: { id },
        data: {
          status: draftStatusAfterEdit(gate.existing!.status),
          published: false,
        },
      });
      return tx.branch.create({
        data: {
          clinicId: id,
          slug,
          nameEn: data.nameEn,
          nameRu: data.nameRu,
          city: data.city,
          country: data.country || "Uzbekistan",
          region: data.region || null,
          district: data.district || null,
          street: data.street || null,
          building: data.building || null,
          addressExtra: data.addressExtra || null,
          addressEn: data.addressEn,
          addressRu: data.addressRu,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          phone: data.phone,
          phonesJson: JSON.stringify((data.phones || []).filter((p) => p && p !== data.phone)),
          email: data.email || null,
          whatsapp: data.whatsapp || null,
          telegram: data.telegram || null,
          website: data.website || null,
          instagram: data.instagram || null,
          socialsJson: JSON.stringify(data.socials || []),
          descriptionEn: data.descriptionEn || "",
          descriptionRu: data.descriptionRu || "",
          advantagesRu: data.advantagesRu || "",
          featuresRu: data.featuresRu || "",
          medicalTourism: data.medicalTourism || false,
          medicalTourismInfoRu: data.medicalTourismInfoRu || "",
          coverUrl: data.coverUrl || null,
          scheduleJson: JSON.stringify(data.schedule ?? JSON.parse(DEFAULT_BRANCH_SCHEDULE_FALLBACK)),
          sortOrder: data.sortOrder ?? count,
          specialties: {
            create: data.specialtyIds.map((specialtyId) => ({ specialtyId })),
          },
        },
        include: branchDetailInclude,
      });
    });

    return reply.code(201).send(serializeBranchDetail(branch));
  });

  app.put("/api/cabinet/clinics/:id/branches/:branchId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId } = request.params as { id: string; branchId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }

    const existing = await prisma.branch.findFirst({ where: { id: branchId, clinicId: id } });
    if (!existing) return reply.code(404).send({ error: "not_found" });

    const parsed = branchBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
    }
    const data = parsed.data;
    const slug = data.slug
      ? await uniqueBranchSlug(id, data.slug, branchId)
      : existing.slug;

    if (data.specialtyIds.length) {
      const clinicSpecs = await prisma.clinicSpecialty.findMany({
        where: { clinicId: id },
        select: { specialtyId: true },
      });
      const allowed = new Set(clinicSpecs.map((s) => s.specialtyId));
      if (data.specialtyIds.some((sid) => !allowed.has(sid))) {
        return reply.code(400).send({ error: "specialty_not_in_clinic" });
      }
    }

    const branch = await prisma.$transaction(async (tx) => {
      await tx.clinic.update({
        where: { id },
        data: {
          status: draftStatusAfterEdit(gate.existing!.status),
          published: false,
        },
      });
      await tx.branchSpecialty.deleteMany({ where: { branchId } });
      return tx.branch.update({
        where: { id: branchId },
        data: {
          slug,
          nameEn: data.nameEn,
          nameRu: data.nameRu,
          city: data.city,
          country: data.country || existing.country || "Uzbekistan",
          region: data.region === undefined ? existing.region : data.region || null,
          district: data.district === undefined ? existing.district : data.district || null,
          street: data.street === undefined ? existing.street : data.street || null,
          building: data.building === undefined ? existing.building : data.building || null,
          addressExtra: data.addressExtra === undefined ? existing.addressExtra : data.addressExtra || null,
          addressEn: data.addressEn,
          addressRu: data.addressRu,
          lat: data.lat === undefined ? existing.lat : data.lat,
          lng: data.lng === undefined ? existing.lng : data.lng,
          phone: data.phone,
          phonesJson: JSON.stringify((data.phones || []).filter((p) => p && p !== data.phone)),
          email: data.email || null,
          whatsapp: data.whatsapp || null,
          telegram: data.telegram || null,
          website: data.website || null,
          instagram: data.instagram === undefined ? existing.instagram : data.instagram || null,
          socialsJson: data.socials !== undefined ? JSON.stringify(data.socials) : existing.socialsJson,
          descriptionEn: data.descriptionEn || "",
          descriptionRu: data.descriptionRu || "",
          advantagesRu: data.advantagesRu ?? existing.advantagesRu,
          featuresRu: data.featuresRu ?? existing.featuresRu,
          medicalTourism: data.medicalTourism ?? existing.medicalTourism,
          medicalTourismInfoRu: data.medicalTourismInfoRu ?? existing.medicalTourismInfoRu,
          coverUrl: data.coverUrl === undefined ? existing.coverUrl : data.coverUrl,
          scheduleJson: data.schedule
            ? JSON.stringify(data.schedule)
            : existing.scheduleJson,
          sortOrder: data.sortOrder ?? existing.sortOrder,
          specialties: {
            create: data.specialtyIds.map((specialtyId) => ({ specialtyId })),
          },
        },
        include: branchDetailInclude,
      });
    });

    return serializeBranchDetail(branch);
  });

  app.delete("/api/cabinet/clinics/:id/branches/:branchId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId } = request.params as { id: string; branchId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const existing = await prisma.branch.findFirst({ where: { id: branchId, clinicId: id } });
    if (!existing) return reply.code(404).send({ error: "not_found" });

    await prisma.$transaction(async (tx) => {
      await tx.branch.delete({ where: { id: branchId } });
      await tx.clinic.update({
        where: { id },
        data: {
          status: draftStatusAfterEdit(gate.existing!.status),
          published: false,
        },
      });
    });
    return { ok: true };
  });

  app.post("/api/cabinet/clinics/:id/branches/:branchId/photos", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId } = request.params as { id: string; branchId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const branch = await prisma.branch.findFirst({ where: { id: branchId, clinicId: id } });
    if (!branch) return reply.code(404).send({ error: "not_found" });

    const body = z
      .object({
        url: z.string().min(1),
        category: z.enum(PHOTO_CATEGORIES).default("other"),
        altRu: z.string().max(200).optional(),
        altEn: z.string().max(200).optional(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const count = await prisma.branchPhoto.count({ where: { branchId } });
    const photo = await prisma.branchPhoto.create({
      data: {
        branchId,
        url: body.data.url,
        category: body.data.category,
        altRu: body.data.altRu || "",
        altEn: body.data.altEn || "",
        sortOrder: count + 1,
      },
    });
    return reply.code(201).send(photo);
  });

  app.delete(
    "/api/cabinet/clinics/:id/branches/:branchId/photos/:photoId",
    async (request, reply) => {
      if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
      const { id, branchId, photoId } = request.params as {
        id: string;
        branchId: string;
        photoId: string;
      };
      const gate = await requireClinicEditable(request, id);
      if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
      if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
      if (gate.error === "locked_on_moderation") {
        return reply.code(409).send({ error: "locked_on_moderation" });
      }
      await prisma.branchPhoto.deleteMany({ where: { id: photoId, branchId } });
      return { ok: true };
    },
  );

  app.put("/api/cabinet/clinics/:id/branches/:branchId/photos/reorder", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId } = request.params as { id: string; branchId: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const branch = await prisma.branch.findFirst({ where: { id: branchId, clinicId: id } });
    if (!branch) return reply.code(404).send({ error: "not_found" });
    const body = z.object({ photoIds: z.array(z.string().min(1)).min(1) }).safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const existing = await prisma.branchPhoto.findMany({
      where: { branchId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((p) => p.id));
    if (
      body.data.photoIds.length !== existingIds.size ||
      body.data.photoIds.some((pid) => !existingIds.has(pid))
    ) {
      return reply.code(400).send({ error: "invalid_photo_ids" });
    }
    await prisma.$transaction(
      body.data.photoIds.map((photoId, index) =>
        prisma.branchPhoto.update({ where: { id: photoId }, data: { sortOrder: index } }),
      ),
    );
    const items = await prisma.branchPhoto.findMany({
      where: { branchId },
      orderBy: { sortOrder: "asc" },
    });
    return { items };
  });

  app.post("/api/cabinet/clinics/:id/branches/:branchId/photos/:photoId/main", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId, photoId } = request.params as {
      id: string;
      branchId: string;
      photoId: string;
    };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const photos = await prisma.branchPhoto.findMany({
      where: { branchId },
      orderBy: { sortOrder: "asc" },
    });
    if (!photos.some((p) => p.id === photoId)) return reply.code(404).send({ error: "not_found" });
    const ordered = [photoId, ...photos.filter((p) => p.id !== photoId).map((p) => p.id)];
    await prisma.$transaction(
      ordered.map((pid, index) =>
        prisma.branchPhoto.update({ where: { id: pid }, data: { sortOrder: index } }),
      ),
    );
    const items = await prisma.branchPhoto.findMany({
      where: { branchId },
      orderBy: { sortOrder: "asc" },
    });
    return { items };
  });

  app.patch("/api/cabinet/clinics/:id/branches/:branchId/photos/:photoId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id, branchId, photoId } = request.params as {
      id: string;
      branchId: string;
      photoId: string;
    };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const body = z
      .object({
        url: z.string().min(1).optional(),
        category: z.enum(PHOTO_CATEGORIES).optional(),
        altRu: z.string().max(200).optional(),
        altEn: z.string().max(200).optional(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const existing = await prisma.branchPhoto.findFirst({ where: { id: photoId, branchId } });
    if (!existing) return reply.code(404).send({ error: "not_found" });
    return prisma.branchPhoto.update({
      where: { id: photoId },
      data: {
        ...(body.data.url !== undefined ? { url: body.data.url } : {}),
        ...(body.data.category !== undefined ? { category: body.data.category } : {}),
        ...(body.data.altRu !== undefined ? { altRu: body.data.altRu } : {}),
        ...(body.data.altEn !== undefined ? { altEn: body.data.altEn } : {}),
      },
    });
  });

  app.post("/api/cabinet/clinics/:id/specialty-suggestions", async (request, reply) => {
    if (!isClinicAuthenticated(request)) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const gate = await requireClinicEditable(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    if (gate.error === "locked_on_moderation") {
      return reply.code(409).send({ error: "locked_on_moderation" });
    }
    const body = z
      .object({
        nameRu: z.string().trim().min(2).max(120),
        nameEn: z.string().trim().min(2).max(120).optional(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const nameEn = body.data.nameEn || body.data.nameRu;
    const baseSlug = slugify(nameEn || body.data.nameRu);
    let slug = baseSlug || `specialty-${Date.now()}`;
    let i = 0;
    while (await prisma.specialty.findUnique({ where: { slug } })) {
      i += 1;
      slug = `${baseSlug}-${i}`;
    }
    const specialty = await prisma.specialty.create({
      data: {
        slug,
        nameRu: body.data.nameRu,
        nameEn,
        descriptionEn: "",
        descriptionRu: "",
        explanationEn: "",
        explanationRu: "",
        keywords: body.data.nameRu,
        sortOrder: 900 + i,
      },
    });
    await prisma.clinicSpecialty.create({
      data: { clinicId: id, specialtyId: specialty.id },
    });
    return reply.code(201).send(specialty);
  });

  app.get("/api/cabinet/clinics/:id/leads", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const gate = await requireClinicOwned(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });

    const query = request.query as { status?: string };
    const leads = await prisma.lead.findMany({
      where: {
        clinicId: id,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { recommendedSpecialty: true },
    });

    return {
      items: leads.map((lead) => ({
        id: lead.id,
        fullName: lead.fullName,
        country: lead.country,
        phone: lead.phone,
        email: lead.email,
        contactMethod: lead.contactMethod,
        arrivalType: lead.arrivalType,
        arrivalDate: lead.arrivalDate,
        medicalNeed: lead.medicalNeed,
        symptoms: lead.symptoms,
        age: lead.age,
        source: lead.source,
        status: lead.status,
        preferredHours: lead.preferredHours,
        notes: lead.notes,
        recommendedSpecialty: lead.recommendedSpecialty
          ? {
              slug: lead.recommendedSpecialty.slug,
              nameRu: lead.recommendedSpecialty.nameRu,
              nameEn: lead.recommendedSpecialty.nameEn,
            }
          : null,
        createdAt: lead.createdAt,
      })),
    };
  });

  app.patch("/api/cabinet/clinics/:id/leads/:leadId", async (request, reply) => {
    if (!isClinicAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id, leadId } = request.params as { id: string; leadId: string };
    const gate = await requireClinicOwned(request, id);
    if (gate.error === "unauthorized") return reply.code(401).send({ error: "unauthorized" });
    if (gate.error === "not_found") return reply.code(404).send({ error: "not_found" });
    const body = z
      .object({
        status: z.enum(["new", "contacted", "closed"]).optional(),
        notes: z.string().trim().max(4000).optional().nullable(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    const lead = await prisma.lead.findFirst({ where: { id: leadId, clinicId: id } });
    if (!lead) return reply.code(404).send({ error: "not_found" });

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(body.data.status ? { status: body.data.status } : {}),
        ...(body.data.notes !== undefined ? { notes: body.data.notes } : {}),
      },
      include: { recommendedSpecialty: true },
    });

    return {
      id: updated.id,
      status: updated.status,
      notes: updated.notes,
      fullName: updated.fullName,
      phone: updated.phone,
      source: updated.source,
      recommendedSpecialty: updated.recommendedSpecialty
        ? {
            slug: updated.recommendedSpecialty.slug,
            nameRu: updated.recommendedSpecialty.nameRu,
            nameEn: updated.recommendedSpecialty.nameEn,
          }
        : null,
      createdAt: updated.createdAt,
    };
  });
}

const DEFAULT_BRANCH_SCHEDULE_FALLBACK = JSON.stringify({
  mon: { open: "09:00", close: "18:00" },
  tue: { open: "09:00", close: "18:00" },
  wed: { open: "09:00", close: "18:00" },
  thu: { open: "09:00", close: "18:00" },
  fri: { open: "09:00", close: "18:00" },
  sat: { open: "09:00", close: "14:00" },
  sun: null,
});

