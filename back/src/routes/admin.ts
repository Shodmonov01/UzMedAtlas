import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/db";
import {
  isAdminAuthenticated,
  setAdminSession,
  clearAdminSession,
  checkAdminPassword,
} from "../lib/auth";
import { publicUploadUrl, slugify, upload } from "../lib/uploads";
import { CITIES } from "../lib/constants";
import { checkRateLimit } from "../lib/rate-limit";
import { getSessionId } from "../lib/session";
import { toCsv } from "../lib/csv";
import { parseLanguages } from "../lib/format";

export const adminRouter = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

function str(value: unknown) {
  return String(value ?? "");
}

function boolFrom(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

adminRouter.post("/login", async (req, res) => {
  const sessionId = getSessionId(req);
  const limited = checkRateLimit(`admin:${sessionId}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    res.status(429).json({ error: "rateLimit" });
    return;
  }
  const password = str(req.body?.password);
  if (!checkAdminPassword(password)) {
    res.status(401).json({ error: "invalid" });
    return;
  }
  setAdminSession(res);
  res.json({ ok: true });
});

adminRouter.post("/logout", (_req, res) => {
  clearAdminSession(res);
  res.json({ ok: true });
});

adminRouter.get("/me", (req, res) => {
  res.json({ ok: isAdminAuthenticated(req) });
});

adminRouter.use(requireAdmin);

adminRouter.get("/dashboard", async (_req, res) => {
  const [clinics, leads, checkerLeads, catalogLeads, events] = await Promise.all([
    prisma.clinic.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { source: "checker" } }),
    prisma.lead.count({ where: { source: "catalog" } }),
    prisma.analyticsEvent.groupBy({
      by: ["type"],
      _count: { type: true },
    }),
  ]);
  const counts = Object.fromEntries(events.map((item) => [item.type, item._count.type]));
  const recent = await prisma.lead.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { clinic: true, recommendedSpecialty: true },
  });
  res.json({ clinics, leads, checkerLeads, catalogLeads, counts, recent });
});

adminRouter.get("/clinics.csv", async (_req, res) => {
  const clinics = await prisma.clinic.findMany({
    orderBy: { nameEn: "asc" },
    include: { specialties: { include: { specialty: true } }, _count: { select: { leads: true } } },
  });
  const header = ["slug", "nameEn", "nameRu", "city", "published", "languages", "responseHours", "leads"];
  const rows = clinics.map((clinic) => [
    clinic.slug,
    clinic.nameEn,
    clinic.nameRu,
    clinic.city,
    clinic.published ? "yes" : "no",
    parseLanguages(clinic.languages).join(" "),
    clinic.responseHours,
    clinic._count.leads,
  ]);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=uzmedatlas-clinics.csv");
  res.send(toCsv(header, rows));
});

adminRouter.get("/leads.csv", async (_req, res) => {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { clinic: true, recommendedSpecialty: true },
  });
  const header = [
    "createdAt",
    "status",
    "source",
    "fullName",
    "country",
    "phone",
    "email",
    "clinic",
    "specialty",
    "contactMethod",
    "preferredHours",
    "utmSource",
    "utmMedium",
    "utmCampaign",
  ];
  const rows = leads.map((lead) => [
    lead.createdAt.toISOString(),
    lead.status,
    lead.source,
    lead.fullName,
    lead.country,
    lead.phone,
    lead.email ?? "",
    lead.clinic.nameEn,
    lead.recommendedSpecialty?.nameEn ?? "",
    lead.contactMethod,
    lead.preferredHours ?? "",
    lead.utmSource ?? "",
    lead.utmMedium ?? "",
    lead.utmCampaign ?? "",
  ]);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=uzmedatlas-leads.csv");
  res.send(toCsv(header, rows));
});

adminRouter.get("/clinics", async (_req, res) => {
  const clinics = await prisma.clinic.findMany({
    orderBy: { nameEn: "asc" },
    include: { _count: { select: { leads: true, services: true } } },
  });
  res.json({ clinics });
});

adminRouter.get("/clinics/:id", async (req, res) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.params.id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: true,
    },
  });
  if (!clinic) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const specialties = await prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } });
  res.json({ clinic, specialties });
});

adminRouter.get("/specialties", async (_req, res) => {
  const specialties = await prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } });
  res.json({ specialties });
});

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

async function saveClinicHandler(req: Request, res: Response) {
  const body = req.body ?? {};
  const id = str(body.id);
  const languages = asList(body.languages);
  const specialtyIds = asList(body.specialtyIds);
  const parsed = clinicSchema.safeParse({
    id: id || undefined,
    slug: str(body.slug),
    nameEn: body.nameEn,
    nameRu: body.nameRu,
    city: body.city,
    addressEn: body.addressEn,
    addressRu: body.addressRu,
    descriptionEn: body.descriptionEn,
    descriptionRu: body.descriptionRu,
    phone: body.phone,
    email: body.email,
    website: str(body.website),
    languages,
    coverColor: str(body.coverColor) || "#1B6B6A",
    published: boolFrom(body.published),
    specialtyIds,
    whatsapp: str(body.whatsapp),
    telegram: str(body.telegram),
    coordinatorName: str(body.coordinatorName),
    coordinatorRoleEn: str(body.coordinatorRoleEn),
    coordinatorRoleRu: str(body.coordinatorRoleRu),
    responseHours: body.responseHours || 24,
    licenseInfoEn: str(body.licenseInfoEn),
    licenseInfoRu: str(body.licenseInfoRu),
    afterRequestEn: str(body.afterRequestEn),
    afterRequestRu: str(body.afterRequestRu),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const slug =
    parsed.data.slug && parsed.data.slug.length > 1
      ? slugify(parsed.data.slug)
      : slugify(parsed.data.nameEn);
  const taken = await prisma.clinic.findFirst({
    where: { slug, ...(id ? { NOT: { id } } : {}) },
  });
  if (taken) {
    res.status(409).json({ error: "slug" });
    return;
  }
  const files = req.files as { logo?: Express.Multer.File[]; photo?: Express.Multer.File[] } | undefined;
  const logoUrl = publicUploadUrl(files?.logo?.[0]);
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
      data: specialtyIds.map((specialtyId) => ({ clinicId: clinic.id, specialtyId })),
    });
  }
  const photoUrl = publicUploadUrl(files?.photo?.[0]);
  if (photoUrl) {
    const last = await prisma.clinicPhoto.findFirst({
      where: { clinicId: clinic.id },
      orderBy: { sortOrder: "desc" },
    });
    await prisma.clinicPhoto.create({
      data: {
        clinicId: clinic.id,
        url: photoUrl,
        altEn: clinic.nameEn,
        altRu: clinic.nameRu,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
  }
  res.json({ ok: true, clinic });
}

adminRouter.post(
  "/clinics",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  saveClinicHandler,
);

adminRouter.post(
  "/clinics/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  (req, res) => {
    req.body = { ...req.body, id: req.params.id };
    return saveClinicHandler(req, res);
  },
);

adminRouter.delete("/clinics/:id", async (req, res) => {
  await prisma.clinic.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

adminRouter.delete("/photos/:id", async (req, res) => {
  await prisma.clinicPhoto.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

adminRouter.post("/clinics/:id/toggle", async (req, res) => {
  const published = boolFrom(req.body?.published);
  await prisma.clinic.update({ where: { id: req.params.id }, data: { published } });
  res.json({ ok: true });
});

adminRouter.post("/clinics/:id/duplicate", async (req, res) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.params.id },
    include: { specialties: true, services: true },
  });
  if (!clinic) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  let slug = `${clinic.slug}-copy`;
  let n = 2;
  while (await prisma.clinic.findUnique({ where: { slug } })) {
    slug = `${clinic.slug}-copy-${n}`;
    n += 1;
  }
  const copy = await prisma.clinic.create({
    data: {
      slug,
      nameEn: `${clinic.nameEn} (copy)`,
      nameRu: `${clinic.nameRu} (копия)`,
      city: clinic.city,
      addressEn: clinic.addressEn,
      addressRu: clinic.addressRu,
      descriptionEn: clinic.descriptionEn,
      descriptionRu: clinic.descriptionRu,
      phone: clinic.phone,
      email: clinic.email,
      website: clinic.website,
      whatsapp: clinic.whatsapp,
      telegram: clinic.telegram,
      languages: clinic.languages,
      logoUrl: clinic.logoUrl,
      coverColor: clinic.coverColor,
      published: false,
      coordinatorName: clinic.coordinatorName,
      coordinatorRoleEn: clinic.coordinatorRoleEn,
      coordinatorRoleRu: clinic.coordinatorRoleRu,
      responseHours: clinic.responseHours,
      licenseInfoEn: clinic.licenseInfoEn,
      licenseInfoRu: clinic.licenseInfoRu,
      afterRequestEn: clinic.afterRequestEn,
      afterRequestRu: clinic.afterRequestRu,
    },
  });
  if (clinic.specialties.length) {
    await prisma.clinicSpecialty.createMany({
      data: clinic.specialties.map((item) => ({
        clinicId: copy.id,
        specialtyId: item.specialtyId,
      })),
    });
  }
  if (clinic.services.length) {
    await prisma.service.createMany({
      data: clinic.services.map((service) => ({
        clinicId: copy.id,
        specialtyId: service.specialtyId,
        canonicalSlug: service.canonicalSlug,
        nameEn: service.nameEn,
        nameRu: service.nameRu,
        descriptionEn: service.descriptionEn,
        descriptionRu: service.descriptionRu,
        priceUsd: service.priceUsd,
      })),
    });
  }
  res.json({ ok: true, clinic: copy });
});

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

adminRouter.post("/specialties", async (req, res) => {
  const id = str(req.body?.id);
  const parsed = specialtySchema.safeParse({
    id: id || undefined,
    slug: slugify(str(req.body?.slug || req.body?.nameEn)),
    nameEn: req.body?.nameEn,
    nameRu: req.body?.nameRu,
    descriptionEn: req.body?.descriptionEn,
    descriptionRu: req.body?.descriptionRu,
    explanationEn: req.body?.explanationEn,
    explanationRu: req.body?.explanationRu,
    keywords: req.body?.keywords,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  if (id) {
    await prisma.specialty.update({ where: { id }, data: parsed.data });
  } else {
    const last = await prisma.specialty.aggregate({ _max: { sortOrder: true } });
    await prisma.specialty.create({
      data: { ...parsed.data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
    });
  }
  res.json({ ok: true });
});

adminRouter.delete("/specialties/:id", async (req, res) => {
  await prisma.specialty.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

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

adminRouter.get("/services", async (_req, res) => {
  const [clinics, specialties, services] = await Promise.all([
    prisma.clinic.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({
      include: { clinic: true, specialty: true },
      orderBy: { nameEn: "asc" },
    }),
  ]);
  res.json({ clinics, specialties, services });
});

adminRouter.post("/services", async (req, res) => {
  const parsed = serviceSchema.safeParse({
    id: str(req.body?.id) || undefined,
    clinicId: req.body?.clinicId,
    specialtyId: req.body?.specialtyId,
    nameEn: req.body?.nameEn,
    nameRu: req.body?.nameRu,
    descriptionEn: req.body?.descriptionEn,
    descriptionRu: req.body?.descriptionRu,
    canonicalSlug: str(req.body?.canonicalSlug) || undefined,
    priceUsd: str(req.body?.priceUsd),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "invalid" });
    return;
  }
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
  res.json({ ok: true });
});

adminRouter.delete("/services/:id", async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

adminRouter.get("/leads", async (req, res) => {
  const q = str(req.query.q).trim();
  const status = str(req.query.status);
  const source = str(req.query.source);
  const leads = await prisma.lead.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
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
  });
  res.json({ leads });
});

adminRouter.get("/leads/:id", async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: { clinic: true, recommendedSpecialty: true, emails: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const events = lead.sessionId
    ? await prisma.analyticsEvent.findMany({
        where: { sessionId: lead.sessionId },
        orderBy: { createdAt: "asc" },
        take: 40,
      })
    : [];
  res.json({ lead, events });
});

adminRouter.patch("/leads/:id", async (req, res) => {
  const status = str(req.body?.status || "new");
  const notes = str(req.body?.notes).slice(0, 4000);
  if (!["new", "contacted", "closed"].includes(status)) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  await prisma.lead.update({
    where: { id: req.params.id },
    data: { status, ...(req.body?.notes !== undefined ? { notes } : {}) },
  });
  res.json({ ok: true });
});

adminRouter.get("/outbox", async (_req, res) => {
  const emails = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { lead: true },
  });
  res.json({ emails });
});
