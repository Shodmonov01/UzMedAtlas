import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  ARRIVAL_TYPES,
  CONTACT_METHODS,
  COUNTRIES,
  PREFERRED_HOURS,
} from "../lib/constants";
import { prisma } from "../lib/db";
import { ensureSessionId } from "../lib/auth";
import { checkRateLimit } from "../lib/rate-limit";
import { trackEvent } from "../lib/analytics";
import { isRecentDuplicate } from "../lib/leads";
import { formatLeadEmail, sendLeadEmails } from "../lib/email";

const leadBodySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  country: z.enum(COUNTRIES),
  phone: z.string().trim().min(8).max(40),
  email: z.string().trim().email().max(120).optional().nullable().or(z.literal("")),
  contactMethod: z.enum(CONTACT_METHODS),
  arrivalType: z.enum(ARRIVAL_TYPES).default("undecided"),
  arrivalDate: z.string().trim().max(40).optional().nullable(),
  medicalNeed: z.string().trim().max(1500).optional().nullable(),
  symptoms: z.string().trim().max(1500).optional().nullable(),
  preferredHours: z.enum(PREFERRED_HOURS).optional().nullable(),
  consent: z.literal(true),
  idempotencyKey: z.string().min(8).max(80).optional(),
  company: z.string().max(80).optional().nullable(),
  source: z.enum(["catalog", "checker"]).optional(),
  specialtySlug: z.string().trim().max(80).optional().nullable(),
  age: z.coerce.number().int().min(1).max(120).optional().nullable(),
  gender: z.enum(["female", "male", "prefer_not"]).optional().nullable(),
  duration: z
    .enum(["few_days", "few_weeks", "few_months", "more_than_year"])
    .optional()
    .nullable(),
  forChild: z.boolean().optional(),
  utmSource: z.string().trim().max(80).optional().nullable(),
  utmMedium: z.string().trim().max(80).optional().nullable(),
  utmCampaign: z.string().trim().max(80).optional().nullable(),
});

export async function leadsRoutes(app: FastifyInstance) {
  app.post("/api/clinics/:slug/leads", async (request, reply) => {
    const sessionId = ensureSessionId(request, reply);
    const limited = checkRateLimit(`lead:${sessionId}`, 10, 15 * 60 * 1000);
    if (!limited.ok) return reply.code(429).send({ error: "rate_limit" });

    const { slug } = request.params as { slug: string };
    const parsed = leadBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_payload", details: parsed.error.flatten() });
    }

    // honeypot
    if (parsed.data.company?.trim()) {
      return { ok: true, id: "ignored" };
    }

    if (parsed.data.contactMethod === "email" && !parsed.data.email) {
      return reply.code(400).send({ error: "email_required" });
    }

    const phone = parsed.data.phone.replace(/[^\d+]/g, "");
    if (!/^\+[0-9]{8,16}$/.test(phone)) {
      return reply.code(400).send({ error: "invalid_phone" });
    }

    const clinic = await prisma.clinic.findFirst({
      where: {
        slug,
        OR: [{ status: "published" }, { published: true }],
      },
    });
    if (!clinic) return reply.code(404).send({ error: "not_found" });

    const usedChecker =
      parsed.data.source === "checker" || Boolean(parsed.data.symptoms?.trim());
    if (!usedChecker && !parsed.data.medicalNeed?.trim()) {
      return reply.code(400).send({ error: "medical_need_required" });
    }

    const idempotencyKey = parsed.data.idempotencyKey || randomUUID();
    const existing = await prisma.lead.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return { ok: true, id: existing.id, duplicate: true };
    }

    const recent = await prisma.lead.findFirst({
      where: { clinicId: clinic.id, phone, sessionId },
      orderBy: { createdAt: "desc" },
    });
    if (recent && isRecentDuplicate(recent.createdAt)) {
      return { ok: true, id: recent.id, duplicate: true };
    }

    let specialtyId: string | null = null;
    let specialtyName: string | null = null;
    if (parsed.data.specialtySlug) {
      const specialty = await prisma.specialty.findUnique({
        where: { slug: parsed.data.specialtySlug },
      });
      specialtyId = specialty?.id ?? null;
      specialtyName = specialty?.nameEn ?? specialty?.nameRu ?? null;
    }

    const arrival =
      parsed.data.arrivalType === "undecided"
        ? "not decided yet"
        : `${parsed.data.arrivalType}: ${parsed.data.arrivalDate || ""}`;

    const lead = await prisma.lead.create({
      data: {
        clinicId: clinic.id,
        fullName: parsed.data.fullName,
        country: parsed.data.country,
        phone,
        email: parsed.data.email || null,
        contactMethod: parsed.data.contactMethod,
        arrivalType: parsed.data.arrivalType,
        arrivalDate:
          parsed.data.arrivalType === "undecided" ? null : parsed.data.arrivalDate || null,
        medicalNeed: usedChecker ? parsed.data.medicalNeed || null : parsed.data.medicalNeed || null,
        symptoms: usedChecker ? parsed.data.symptoms || null : null,
        age: usedChecker ? parsed.data.age ?? null : null,
        gender: usedChecker ? parsed.data.gender ?? null : null,
        duration: usedChecker ? parsed.data.duration ?? null : null,
        forChild: usedChecker ? Boolean(parsed.data.forChild) : false,
        source: usedChecker ? "checker" : "catalog",
        status: "new",
        sessionId,
        idempotencyKey,
        preferredHours: parsed.data.preferredHours || "anytime",
        consentAt: new Date(),
        utmSource: parsed.data.utmSource || null,
        utmMedium: parsed.data.utmMedium || null,
        utmCampaign: parsed.data.utmCampaign || null,
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
        symptoms: usedChecker ? parsed.data.symptoms : null,
        medicalNeed: parsed.data.medicalNeed,
        age: usedChecker ? parsed.data.age : null,
        gender: usedChecker ? parsed.data.gender : null,
        duration: usedChecker ? parsed.data.duration : null,
        forChild: usedChecker ? Boolean(parsed.data.forChild) : false,
        preferredHours: parsed.data.preferredHours,
        utmSource: parsed.data.utmSource,
      }),
    });

    await trackEvent(
      "lead_submit",
      {
        clinic: clinic.slug,
        method: parsed.data.contactMethod,
        source: usedChecker ? "checker" : "catalog",
      },
      sessionId,
    );

    return reply.code(201).send({ ok: true, id: lead.id });
  });
}
