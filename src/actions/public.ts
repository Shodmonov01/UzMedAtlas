"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { rankSpecialties, detectRedFlags } from "@/lib/checker";
import { getCheckerState, setCheckerState } from "@/lib/checker-state";
import { trackEvent } from "@/lib/analytics";
import { go } from "@/lib/redirect";
import { DURATIONS, GENDERS } from "@/lib/constants";
import { getSessionId, setLastLeadId, getUtm } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { formatLeadEmail, sendLeadEmails } from "@/lib/email";
import { combinePhone } from "@/lib/phone";
import { isRecentDuplicate } from "@/lib/leads";
import { PREFERRED_HOURS } from "@/lib/constants";

const symptomsSchema = z.object({
  symptoms: z.string().trim().min(8).max(1500),
  locale: z.string(),
});

export async function startChecker(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const parsed = symptomsSchema.safeParse({
    symptoms: formData.get("symptoms"),
    locale,
  });
  if (!parsed.success) {
    go("/", locale);
  }
  await setCheckerState({
    skipped: false,
    symptoms: parsed.data.symptoms,
    redFlags: detectRedFlags(parsed.data.symptoms),
  });
  await trackEvent("checker_start");
  go("/checker", parsed.data.locale);
}

export async function skipChecker(formData: FormData) {
  const locale = (formData.get("locale") as string) || "en";
  await setCheckerState({ skipped: true });
  await trackEvent("checker_skip");
  go("/clinics", locale);
}

const detailsSchema = z.object({
  age: z.coerce.number().int().min(1).max(120),
  gender: z.enum(GENDERS),
  duration: z.enum(DURATIONS),
  forChild: z.boolean(),
  locale: z.string(),
});

export async function completeChecker(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const parsed = detailsSchema.safeParse({
    age: formData.get("age"),
    gender: formData.get("gender"),
    duration: formData.get("duration"),
    forChild: formData.get("forChild") === "on",
    locale,
  });
  if (!parsed.success) {
    go("/checker", locale);
  }

  const current = (await getCheckerState()) ?? {};
  if (!current.symptoms) {
    go("/", locale);
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

  await setCheckerState({
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
  await trackEvent("checker_complete", {
    specialty: slugs[0] ?? "none",
    alternatives: String(slugs.length),
    redFlags: redFlags.join(",") || "none",
  });
  go("/checker/results", locale);
}

export async function chooseSpecialty(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const slug = String(formData.get("specialtySlug") || "");
  const current = (await getCheckerState()) ?? {};
  if (!current.symptoms || !slug) {
    go("/", locale);
  }
  const exists = await prisma.specialty.findUnique({ where: { slug } });
  if (!exists) go("/checker/results", locale);
  await setCheckerState({
    ...current,
    specialtySlug: slug,
    specialtySlugs: Array.from(new Set([slug, ...(current.specialtySlugs ?? [])])),
  });
  await trackEvent("checker_change_specialty", { specialty: slug });
  go("/checker/results", locale);
}

const leadSchema = z.object({
  clinicSlug: z.string().min(1),
  locale: z.string(),
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

export async function submitLead(formData: FormData) {
  const locale = ((formData.get("locale") as string) || "en") as "en" | "ru";
  if (String(formData.get("company") || "").trim()) {
    go("/apply/success", locale);
  }
  const parsed = leadSchema.safeParse({
    clinicSlug: formData.get("clinicSlug"),
    locale,
    fullName: formData.get("fullName"),
    country: formData.get("country"),
    dial: formData.get("dial") || "+",
    nationalPhone: formData.get("nationalPhone") || formData.get("phone") || "",
    email: formData.get("email") || "",
    contactMethod: formData.get("contactMethod"),
    arrivalType: formData.get("arrivalType"),
    arrivalDate: formData.get("arrivalDate") || "",
    medicalNeed: formData.get("medicalNeed") || "",
    preferredHours: formData.get("preferredHours") || "anytime",
    consent: formData.get("consent") === "on" ? "on" : "",
    company: String(formData.get("company") || ""),
    idempotencyKey: formData.get("idempotencyKey") || "",
  });

  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    if (fields.consent) return { error: "consent" as const };
    return { error: "invalid" as const };
  }

  if (parsed.data.contactMethod === "email" && !parsed.data.email) {
    return { error: "emailRequired" as const };
  }

  const phone = combinePhone(parsed.data.dial, parsed.data.nationalPhone);
  if (!/^\+[0-9]{8,16}$/.test(phone.replace(/[^\d+]/g, ""))) {
    return { error: "invalidPhone" as const };
  }

  const sessionId = await getSessionId();
  const limited = checkRateLimit(`lead:${sessionId}`);
  if (!limited.ok) {
    return { error: "rateLimit" as const };
  }

  const existing = await prisma.lead.findUnique({
    where: { idempotencyKey: parsed.data.idempotencyKey },
  });
  if (existing) {
    await setLastLeadId(existing.id);
    go("/apply/success", locale);
  }

  const clinic = await prisma.clinic.findUnique({
    where: { slug: parsed.data.clinicSlug, published: true },
  });
  if (!clinic) {
    return { error: "invalid" as const };
  }

  const duplicate = await prisma.lead.findFirst({
    where: { clinicId: clinic.id, phone },
    orderBy: { createdAt: "desc" },
  });
  if (duplicate && isRecentDuplicate(duplicate.createdAt)) {
    return { error: "duplicate" as const };
  }

  const checker = await getCheckerState();
  const usedChecker = Boolean(checker && !checker.skipped && checker.symptoms);

  if (!usedChecker && !parsed.data.medicalNeed) {
    return { error: "medicalNeed" as const };
  }

  let specialtyId: string | null = null;
  let specialtyName: string | null = null;
  if (checker?.specialtySlug) {
    const specialty = await prisma.specialty.findUnique({
      where: { slug: checker.specialtySlug },
    });
    specialtyId = specialty?.id ?? null;
    specialtyName = specialty?.nameEn ?? null;
  }

  const arrival =
    parsed.data.arrivalType === "undecided"
      ? "not decided yet"
      : `${parsed.data.arrivalType}: ${parsed.data.arrivalDate || ""}`;

  const utm = await getUtm();

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

  await trackEvent("lead_submit", {
    clinic: clinic.slug,
    source: usedChecker ? "checker" : "catalog",
  });
  await setLastLeadId(lead.id);
  go("/apply/success", locale);
}

export async function recordClinicView(clinicSlug: string) {
  await trackEvent("clinic_view", { clinic: clinicSlug });
}
