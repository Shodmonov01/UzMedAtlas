import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  checkAdminPassword,
  clearAdminSession,
  ensureSessionId,
  isAdminAuthenticated,
  setAdminSession,
} from "../lib/auth";
import { prisma } from "../lib/db";
import { parseLanguages } from "../lib/format";
import { checkRateLimit } from "../lib/rate-limit";
import { publishedFromStatus, buildModerationChecklist } from "../lib/clinic-workflow";
import { clinicDetailInclude, serializeDoctor } from "../lib/clinic-serialize";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(clinic: any) {
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
    languages: parseLanguages(clinic.languages),
    logoUrl: clinic.logoUrl,
    coverColor: clinic.coverColor,
    status: clinic.status,
    moderatorNote: clinic.moderatorNote,
    published: clinic.published,
    coordinatorName: clinic.coordinatorName,
    chiefDoctorName: clinic.chiefDoctorName,
    chiefDoctorRoleRu: clinic.chiefDoctorRoleRu,
    chiefDoctorRoleEn: clinic.chiefDoctorRoleEn,
    whyChooseRu: clinic.whyChooseRu,
    whyChooseEn: clinic.whyChooseEn,
    medicalTourism: clinic.medicalTourism,
    updatedAt: clinic.updatedAt,
    createdAt: clinic.createdAt,
    specialtyIds: clinic.specialties?.map((s: { specialtyId: string }) => s.specialtyId) ?? [],
    specialties:
      clinic.specialties?.map((s: { specialty: { id: string; slug: string; nameRu: string; nameEn: string } }) => ({
        id: s.specialty.id,
        slug: s.specialty.slug,
        nameRu: s.specialty.nameRu,
        nameEn: s.specialty.nameEn,
      })) ?? [],
  };
}

export async function adminRoutes(app: FastifyInstance) {
  app.post("/api/admin/login", async (request, reply) => {
    const sessionId = ensureSessionId(request, reply);
    const limited = checkRateLimit(`admin:${sessionId}`, 8, 15 * 60 * 1000);
    if (!limited.ok) {
      return reply.code(429).send({ error: "rate_limit" });
    }
    const body = z.object({ password: z.string().min(1) }).safeParse(request.body);
    if (!body.success || !checkAdminPassword(body.data.password)) {
      return reply.code(401).send({ error: "invalid" });
    }
    setAdminSession(reply);
    return { ok: true };
  });

  app.post("/api/admin/logout", async (_request, reply) => {
    clearAdminSession(reply);
    return { ok: true };
  });

  app.get("/api/admin/me", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ authenticated: false });
    }
    return { authenticated: true };
  });

  app.get("/api/admin/stats", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const [clinics, leads, specialties, moderation] = await Promise.all([
      prisma.clinic.count(),
      prisma.lead.count(),
      prisma.specialty.count(),
      prisma.clinic.count({ where: { status: "moderation" } }),
    ]);
    return { clinics, leads, specialties, moderation };
  });

  app.get("/api/admin/moderation", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const query = request.query as { status?: string };
    const where =
      query.status && query.status !== "all"
        ? { status: query.status }
        : { status: { in: ["moderation", "needs_changes", "approved", "published", "draft"] } };

    const clinics = await prisma.clinic.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        specialties: { include: { specialty: true } },
        _count: { select: { branches: true, doctors: true } },
      },
    });
    return {
      items: clinics.map((clinic) => ({
        ...serialize(clinic),
        branchCount: clinic._count.branches,
        doctorCount: clinic._count.doctors,
      })),
    };
  });

  app.get("/api/admin/moderation/:id", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        ...clinicDetailInclude,
        moderationLogs: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!clinic) return reply.code(404).send({ error: "not_found" });

    const checklist = buildModerationChecklist(clinic);

    return {
      ...serialize(clinic),
      photos: clinic.photos,
      doctors: clinic.doctors.map(serializeDoctor),
      equipment: clinic.equipment,
      certificates: clinic.certificates,
      branches: clinic.branches.map((b) => ({
        id: b.id,
        slug: b.slug,
        nameRu: b.nameRu,
        nameEn: b.nameEn,
        city: b.city,
        addressRu: b.addressRu,
        addressEn: b.addressEn,
        phone: b.phone,
        descriptionRu: b.descriptionRu,
        descriptionEn: b.descriptionEn,
        coverUrl: b.coverUrl,
        lat: b.lat,
        lng: b.lng,
        specialties: b.specialties.map((s) => s.specialty),
        specialtyCount: b.specialties.length,
        doctorCount: b._count.doctorLinks,
        serviceCount: b._count.services,
        photoCount: b.photos.length,
      })),
      moderationLogs: clinic.moderationLogs,
      branchCount: clinic._count.branches,
      doctorCount: clinic._count.doctors,
      checklist,
    };
  });

  app.post("/api/admin/moderation/:id/approve", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: { specialties: true, branches: true, photos: true, doctors: true, equipment: true },
    });
    if (!clinic) return reply.code(404).send({ error: "not_found" });
    if (clinic.status !== "moderation") {
      return reply.code(409).send({ error: "invalid_status", status: clinic.status });
    }
    const checklist = buildModerationChecklist(clinic);
    if (!checklist.ready) {
      return reply.code(400).send({ error: "checklist_failed", checklist });
    }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.moderationLog.create({ data: { clinicId: id, action: "approve" } });
      return tx.clinic.update({
        where: { id },
        data: {
          status: "approved",
          published: false,
          moderatorNote: null,
        },
        include: { specialties: { include: { specialty: true } } },
      });
    });
    return serialize(updated);
  });

  app.post("/api/admin/moderation/:id/reject", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const body = z
      .object({ note: z.string().trim().min(5).max(2000) })
      .safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "invalid_payload" });
    }
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) return reply.code(404).send({ error: "not_found" });
    if (clinic.status !== "moderation") {
      return reply.code(409).send({ error: "invalid_status", status: clinic.status });
    }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.moderationLog.create({
        data: { clinicId: id, action: "reject", note: body.data.note },
      });
      return tx.clinic.update({
        where: { id },
        data: {
          status: "needs_changes",
          published: false,
          moderatorNote: body.data.note,
        },
        include: { specialties: { include: { specialty: true } } },
      });
    });
    return serialize(updated);
  });

  app.post("/api/admin/moderation/:id/publish", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) return reply.code(404).send({ error: "not_found" });
    if (!["approved", "published"].includes(clinic.status)) {
      return reply.code(409).send({ error: "invalid_status", status: clinic.status });
    }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.moderationLog.create({ data: { clinicId: id, action: "publish" } });
      return tx.clinic.update({
        where: { id },
        data: {
          status: "published",
          published: publishedFromStatus("published"),
          moderatorNote: null,
        },
        include: { specialties: { include: { specialty: true } } },
      });
    });
    return serialize(updated);
  });

  app.post("/api/admin/moderation/:id/unpublish", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) return reply.code(404).send({ error: "not_found" });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.moderationLog.create({ data: { clinicId: id, action: "unpublish" } });
      return tx.clinic.update({
        where: { id },
        data: {
          status: "approved",
          published: false,
        },
        include: { specialties: { include: { specialty: true } } },
      });
    });
    return serialize(updated);
  });

  app.get("/api/admin/leads", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const query = request.query as { status?: string; source?: string; q?: string };
    const q = query.q?.trim();
    const leads = await prisma.lead.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.source ? { source: query.source } : {}),
        ...(q
          ? {
              OR: [
                { fullName: { contains: q } },
                { phone: { contains: q } },
                { email: { contains: q } },
                { country: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { clinic: true, recommendedSpecialty: true },
      take: 200,
    });

    return {
      items: leads.map((lead) => ({
        id: lead.id,
        fullName: lead.fullName,
        country: lead.country,
        phone: lead.phone,
        email: lead.email,
        contactMethod: lead.contactMethod,
        source: lead.source,
        status: lead.status,
        medicalNeed: lead.medicalNeed,
        symptoms: lead.symptoms,
        age: lead.age,
        preferredHours: lead.preferredHours,
        notes: lead.notes,
        createdAt: lead.createdAt,
        clinic: {
          id: lead.clinic.id,
          slug: lead.clinic.slug,
          nameRu: lead.clinic.nameRu,
          nameEn: lead.clinic.nameEn,
        },
        recommendedSpecialty: lead.recommendedSpecialty
          ? {
              slug: lead.recommendedSpecialty.slug,
              nameRu: lead.recommendedSpecialty.nameRu,
              nameEn: lead.recommendedSpecialty.nameEn,
            }
          : null,
      })),
    };
  });

  app.get("/api/admin/leads/:id", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { clinic: true, recommendedSpecialty: true, emails: true },
    });
    if (!lead) return reply.code(404).send({ error: "not_found" });
    return lead;
  });

  app.patch("/api/admin/leads/:id", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const { id } = request.params as { id: string };
    const body = z
      .object({
        status: z.enum(["new", "contacted", "closed"]).optional(),
        notes: z.string().trim().max(4000).optional().nullable(),
      })
      .safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "not_found" });

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.data.status ? { status: body.data.status } : {}),
        ...(body.data.notes !== undefined ? { notes: body.data.notes } : {}),
      },
      include: { clinic: true, recommendedSpecialty: true },
    });
    return updated;
  });
}
