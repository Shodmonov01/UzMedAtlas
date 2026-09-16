import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db";
import { rankSpecialties, detectRedFlags } from "../lib/checker";
import { getCheckerState, setCheckerState, hasCheckerDetails } from "../lib/checker-state";
import { trackEvent } from "../lib/analytics";
import { DURATIONS, GENDERS, PREFERRED_HOURS } from "../lib/constants";
import { getSessionId, setLastLeadId, getLastLeadId, getUtm } from "../lib/session";
import { checkRateLimit } from "../lib/rate-limit";
import { formatLeadEmail, sendLeadEmails } from "../lib/email";
import { combinePhone } from "../lib/phone";
import { isRecentDuplicate } from "../lib/leads";
import { queryClinics } from "../lib/catalog-query";
import { CANONICAL_SERVICES } from "../lib/canonical";

export const publicRouter = Router();

function str(value: unknown) {
  return String(value ?? "");
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

publicRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

publicRouter.get("/meta", async (_req, res) => {
  const [clinicCount, specialties, cityGroups] = await Promise.all([
    prisma.clinic.count({ where: { published: true } }),
    prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.clinic.groupBy({
      by: ["city"],
      where: { published: true },
      _count: { city: true },
    }),
  ]);
  res.json({
    clinicCount,
    specialties,
    cities: cityGroups.map((item) => ({ city: item.city, count: item._count.city })),
    canonicalServices: CANONICAL_SERVICES,
  });
});

publicRouter.get("/home", async (req, res) => {
  await trackEvent(req, "home_view");
  const [clinicCount, cityGroups] = await Promise.all([
    prisma.clinic.count({ where: { published: true } }),
    prisma.clinic.groupBy({
      by: ["city"],
      where: { published: true },
      _count: { city: true },
    }),
  ]);
  const featured = (await queryClinics({ sort: "response" })).slice(0, 4);
  res.json({
    clinicCount,
    cities: cityGroups.map((item) => ({ city: item.city, count: item._count.city })),
    featured,
  });
});

publicRouter.get("/clinics", async (req, res) => {
  const filters = {
    q: str(req.query.q) || undefined,
    city: str(req.query.city) || undefined,
    specialty: str(req.query.specialty) || undefined,
    service: str(req.query.service) || undefined,
    sort: "name",
    lang: str(req.query.lang) || undefined,
    priceMax: num(req.query.priceMax),
    hoursMax: num(req.query.hoursMax),
    messenger: str(req.query.messenger) || undefined,
    coordinator: str(req.query.coordinator) === "1" ? true : undefined,
  };
  await trackEvent(req, "catalog_view", {
    q: filters.q || "",
    specialty: filters.specialty || "",
    lang: filters.lang || "",
  });
  const clinics = await queryClinics(filters);
  const hasFilters = Boolean(
    filters.q ||
      filters.city ||
      filters.specialty ||
      filters.service ||
      filters.lang ||
      filters.priceMax ||
      filters.hoursMax ||
      filters.messenger ||
      filters.coordinator,
  );
  const suggestions = hasFilters && clinics.length === 0 ? await queryClinics({ sort: "response" }) : [];
  res.json({ clinics, suggestions: suggestions.slice(0, 3) });
});

publicRouter.get("/clinics/:slug", async (req, res) => {
  const slug = String(req.params.slug || "");
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
      services: { include: { specialty: true }, orderBy: { nameEn: "asc" } },
    },
  });
  if (!clinic || !clinic.published) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  await trackEvent(req, "clinic_view", { clinic: clinic.slug });

  const specialtyIds = clinic.specialties.map((item) => item.specialtyId);
  const relatedRaw = await prisma.clinic.findMany({
    where: {
      published: true,
      id: { not: clinic.id },
      OR: [
        { city: clinic.city },
        ...(specialtyIds.length
          ? [{ specialties: { some: { specialtyId: { in: specialtyIds } } } }]
          : []),
      ],
    },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
      services: true,
    },
    take: 8,
  });
  const related = relatedRaw
    .map((item) => ({
      ...item,
      overlap: item.specialties.filter((rel) => specialtyIds.includes(rel.specialtyId)).length,
      fromPrice:
        item.services
          .map((service) => service.priceUsd)
          .filter((value): value is number => value != null)
          .sort((a, b) => a - b)[0] ?? null,
    }))
    .sort((a, b) => b.overlap - a.overlap || a.responseHours - b.responseHours)
    .slice(0, 3);

  res.json({ clinic, related });
});

publicRouter.post("/checker/start", async (req, res) => {
  const parsed = z
    .object({ symptoms: z.string().trim().min(8).max(1500) })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  setCheckerState(res, {
    skipped: false,
    symptoms: parsed.data.symptoms,
    redFlags: detectRedFlags(parsed.data.symptoms),
  });
  await trackEvent(req, "checker_start");
  res.json({ ok: true, next: "checker" });
});

publicRouter.post("/checker/skip", async (req, res) => {
  setCheckerState(res, { skipped: true });
  await trackEvent(req, "checker_skip");
  res.json({ ok: true, next: "clinics" });
});

publicRouter.post("/checker/complete", async (req, res) => {
  const parsed = z
    .object({
      age: z.coerce.number().int().min(1).max(120),
      gender: z.enum(GENDERS),
      duration: z.enum(DURATIONS),
      forChild: z.boolean().optional(),
    })
    .safeParse({
      ...req.body,
      forChild: req.body?.forChild === true || req.body?.forChild === "on",
    });
  if (!parsed.success) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const current = getCheckerState(req) ?? {};
  if (!current.symptoms) {
    res.status(400).json({ error: "no_symptoms" });
    return;
  }
  const specialties = await prisma.specialty.findMany();
  const ranked = rankSpecialties(
    {
      text: current.symptoms,
      age: parsed.data.age,
      gender: parsed.data.gender,
      forChild: parsed.data.forChild,
      duration: parsed.data.duration,
    },
    specialties,
  );
  const slugs = ranked.map((item) => item.specialty.slug);
  const redFlags = detectRedFlags(current.symptoms);
  setCheckerState(res, {
    ...current,
    skipped: false,
    age: parsed.data.age,
    gender: parsed.data.gender,
    duration: parsed.data.duration,
    forChild: parsed.data.forChild,
    specialtySlug: slugs[0],
    specialtySlugs: slugs,
    redFlags,
  });
  await trackEvent(req, "checker_complete", {
    specialty: slugs[0] ?? "none",
    alternatives: String(slugs.length),
    redFlags: redFlags.join(",") || "none",
  });
  res.json({ ok: true, next: "results" });
});

publicRouter.post("/checker/choose", async (req, res) => {
  const slug = str(req.body?.specialtySlug);
  const current = getCheckerState(req) ?? {};
  if (!current.symptoms || !slug) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const exists = await prisma.specialty.findUnique({ where: { slug } });
  if (!exists) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  setCheckerState(res, {
    ...current,
    specialtySlug: slug,
    specialtySlugs: Array.from(new Set([slug, ...(current.specialtySlugs ?? [])])),
  });
  await trackEvent(req, "checker_change_specialty", { specialty: slug });
  res.json({ ok: true });
});

publicRouter.get("/checker/state", (req, res) => {
  const state = getCheckerState(req);
  res.json({ state, usedChecker: hasCheckerDetails(state) });
});

publicRouter.get("/checker/results", async (req, res) => {
  const state = getCheckerState(req);
  if (!state?.specialtySlug || !state.symptoms) {
    res.status(400).json({ error: "no_state" });
    return;
  }
  const specialty = await prisma.specialty.findUnique({ where: { slug: state.specialtySlug } });
  if (!specialty) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const alternatives = await prisma.specialty.findMany({
    where: { slug: { in: (state.specialtySlugs ?? []).filter((slug) => slug !== specialty.slug) } },
    orderBy: { sortOrder: "asc" },
  });
  const clinics = await prisma.clinic.findMany({
    where: {
      published: true,
      specialties: { some: { specialtyId: specialty.id } },
    },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      specialties: { include: { specialty: true } },
      services: true,
    },
  });
  const ranked = clinics
    .map((clinic) => ({
      ...clinic,
      fromPrice:
        clinic.services
          .map((item) => item.priceUsd)
          .filter((value): value is number => value != null)
          .sort((a, b) => a - b)[0] ?? null,
    }))
    .sort((a, b) => a.responseHours - b.responseHours);
  res.json({ state, specialty, alternatives, clinics: ranked });
});

publicRouter.get("/apply/success", async (req, res) => {
  const leadId = getLastLeadId(req);
  const lead = leadId
    ? await prisma.lead.findUnique({
        where: { id: leadId },
        include: { clinic: true },
      })
    : null;
  res.json({ lead });
});

publicRouter.get("/apply/:slug", async (req, res) => {
  const clinic = await prisma.clinic.findUnique({ where: { slug: String(req.params.slug || "") } });
  if (!clinic || !clinic.published) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  await trackEvent(req, "apply_start", { clinic: clinic.slug });
  const checker = getCheckerState(req);
  const usedChecker = hasCheckerDetails(checker);
  const specialty = checker?.specialtySlug
    ? await prisma.specialty.findUnique({ where: { slug: checker.specialtySlug } })
    : null;
  res.json({ clinic, usedChecker, checker, specialty });
});

const leadSchema = z.object({
  clinicSlug: z.string().min(1),
  fullName: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  dial: z.string().trim().min(1),
  nationalPhone: z.string().trim().min(5),
  email: z.string().trim().email().optional().or(z.literal("")),
  contactMethod: z.enum(["whatsapp", "telegram", "phone", "email"]),
  arrivalType: z.enum(["exact", "approximate", "undecided"]),
  arrivalDate: z.string().optional(),
  medicalNeed: z.string().trim().max(1500).optional(),
  preferredHours: z.enum(PREFERRED_HOURS).optional(),
  consent: z.literal("on"),
  company: z.string().max(80).optional(),
  idempotencyKey: z.string().min(8).max(80),
});

publicRouter.post("/leads", async (req, res) => {
  if (str(req.body?.company).trim()) {
    res.json({ ok: true, honeypot: true });
    return;
  }
  const parsed = leadSchema.safeParse({
    ...req.body,
    consent: req.body?.consent === "on" || req.body?.consent === true ? "on" : "",
    email: req.body?.email || "",
    arrivalDate: req.body?.arrivalDate || "",
    medicalNeed: req.body?.medicalNeed || "",
    preferredHours: req.body?.preferredHours || "anytime",
    company: str(req.body?.company),
    dial: req.body?.dial || "+",
    nationalPhone: req.body?.nationalPhone || req.body?.phone || "",
  });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    if (fields.consent) {
      res.status(400).json({ error: "consent" });
      return;
    }
    res.status(400).json({ error: "invalid" });
    return;
  }
  if (parsed.data.contactMethod === "email" && !parsed.data.email) {
    res.status(400).json({ error: "emailRequired" });
    return;
  }
  const phone = combinePhone(parsed.data.dial, parsed.data.nationalPhone);
  if (!/^\+[0-9]{8,16}$/.test(phone.replace(/[^\d+]/g, ""))) {
    res.status(400).json({ error: "invalidPhone" });
    return;
  }
  const sessionId = getSessionId(req);
  const limited = checkRateLimit(`lead:${sessionId}`);
  if (!limited.ok) {
    res.status(429).json({ error: "rateLimit" });
    return;
  }
  const existing = await prisma.lead.findUnique({
    where: { idempotencyKey: parsed.data.idempotencyKey },
  });
  if (existing) {
    setLastLeadId(res, existing.id);
    res.json({ ok: true, duplicateSubmit: true });
    return;
  }
  const clinic = await prisma.clinic.findUnique({
    where: { slug: parsed.data.clinicSlug, published: true },
  });
  if (!clinic) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const duplicate = await prisma.lead.findFirst({
    where: { clinicId: clinic.id, phone },
    orderBy: { createdAt: "desc" },
  });
  if (duplicate && isRecentDuplicate(duplicate.createdAt)) {
    res.status(409).json({ error: "duplicate" });
    return;
  }
  const checker = getCheckerState(req);
  const usedChecker = Boolean(checker && !checker.skipped && checker.symptoms);
  if (!usedChecker && !parsed.data.medicalNeed) {
    res.status(400).json({ error: "medicalNeed" });
    return;
  }
  let specialtyId: string | null = null;
  let specialtyName: string | null = null;
  if (checker?.specialtySlug) {
    const specialty = await prisma.specialty.findUnique({ where: { slug: checker.specialtySlug } });
    specialtyId = specialty?.id ?? null;
    specialtyName = specialty?.nameEn ?? null;
  }
  const arrival =
    parsed.data.arrivalType === "undecided"
      ? "not decided yet"
      : `${parsed.data.arrivalType}: ${parsed.data.arrivalDate || ""}`;
  const utm = getUtm(req);
  const lead = await prisma.lead.create({
    data: {
      clinicId: clinic.id,
      fullName: parsed.data.fullName,
      country: parsed.data.country,
      phone,
      email: parsed.data.email || null,
      contactMethod: parsed.data.contactMethod,
      arrivalType: parsed.data.arrivalType,
      arrivalDate: parsed.data.arrivalType === "undecided" ? null : parsed.data.arrivalDate || null,
      medicalNeed: usedChecker ? null : parsed.data.medicalNeed,
      symptoms: usedChecker ? checker?.symptoms : null,
      age: usedChecker ? checker?.age : null,
      gender: usedChecker ? checker?.gender : null,
      duration: usedChecker ? checker?.duration : null,
      forChild: usedChecker ? Boolean(checker?.forChild) : false,
      source: usedChecker ? "checker" : "catalog",
      status: "new",
      sessionId,
      idempotencyKey: parsed.data.idempotencyKey,
      preferredHours: parsed.data.preferredHours || "anytime",
      consentAt: new Date(),
      utmSource: utm?.source || null,
      utmMedium: utm?.medium || null,
      utmCampaign: utm?.campaign || null,
      recommendedSpecialtyId: usedChecker ? specialtyId : null,
    },
  });
  await sendLeadEmails({
    leadId: lead.id,
    clinicEmail: clinic.email,
    clinicName: clinic.nameEn,
    subject: `UzMedAtlas request: ${parsed.data.fullName} → ${clinic.nameEn}`,
    body: formatLeadEmail({
      clinicName: clinic.nameEn,
      fullName: parsed.data.fullName,
      country: parsed.data.country,
      phone,
      email: parsed.data.email,
      contactMethod: parsed.data.contactMethod,
      arrival,
      source: usedChecker ? "symptom checker" : "catalog",
      specialty: specialtyName,
      symptoms: usedChecker ? checker?.symptoms : null,
      medicalNeed: usedChecker ? null : parsed.data.medicalNeed,
      age: usedChecker ? checker?.age : null,
      gender: usedChecker ? checker?.gender : null,
      duration: usedChecker ? checker?.duration : null,
      forChild: usedChecker ? Boolean(checker?.forChild) : false,
      preferredHours: parsed.data.preferredHours,
      utmSource: utm?.source,
    }),
  });
  await trackEvent(req, "lead_submit", {
    clinic: clinic.slug,
    source: usedChecker ? "checker" : "catalog",
  });
  setLastLeadId(res, lead.id);
  res.json({ ok: true, leadId: lead.id });
});

publicRouter.post("/events", async (req, res) => {
  const type = str(req.body?.type);
  if (!type) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  await trackEvent(req, type, req.body?.meta ?? {});
  res.json({ ok: true });
});
