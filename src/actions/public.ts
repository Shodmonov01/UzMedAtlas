"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { pickSpecialty } from "@/lib/checker";
import { getCheckerState, setCheckerState } from "@/lib/checker-state";
import { trackEvent } from "@/lib/analytics";
import { go } from "@/lib/redirect";
import { DURATIONS, GENDERS } from "@/lib/constants";

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
  locale: z.string(),
});

export async function completeChecker(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const parsed = detailsSchema.safeParse({
    age: formData.get("age"),
    gender: formData.get("gender"),
    duration: formData.get("duration"),
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
  const { specialty } = pickSpecialty(current.symptoms, specialties);

  await setCheckerState({
    ...current,
    skipped: false,
    age: parsed.data.age,
    gender: parsed.data.gender,
    duration: parsed.data.duration,
    specialtySlug: specialty.slug,
  });
  await trackEvent("checker_complete", { specialty: specialty.slug });
  go("/checker/results", locale);
}

const leadSchema = z.object({
  clinicSlug: z.string().min(1),
  locale: z.string(),
  fullName: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s()-]{8,20}$/),
  email: z.string().trim().email().optional().or(z.literal("")),
  contactMethod: z.enum(["whatsapp", "telegram", "phone", "email"]),
  arrivalType: z.enum(["exact", "approximate", "undecided"]),
  arrivalDate: z.string().optional(),
  medicalNeed: z.string().trim().max(1500).optional(),
});

export async function submitLead(formData: FormData) {
  const parsed = leadSchema.safeParse({
    clinicSlug: formData.get("clinicSlug"),
    locale: formData.get("locale") || "en",
    fullName: formData.get("fullName"),
    country: formData.get("country"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    contactMethod: formData.get("contactMethod"),
    arrivalType: formData.get("arrivalType"),
    arrivalDate: formData.get("arrivalDate") || "",
    medicalNeed: formData.get("medicalNeed") || "",
  });

  const locale = ((formData.get("locale") as string) || "en") as "en" | "ru";

  if (!parsed.success) {
    return { error: "invalid" as const };
  }

  if (parsed.data.contactMethod === "email" && !parsed.data.email) {
    return { error: "emailRequired" as const };
  }

  const clinic = await prisma.clinic.findUnique({
    where: { slug: parsed.data.clinicSlug, published: true },
  });
  if (!clinic) {
    return { error: "invalid" as const };
  }

  const checker = await getCheckerState();
  const usedChecker = Boolean(checker && !checker.skipped && checker.symptoms);

  if (!usedChecker && !parsed.data.medicalNeed) {
    return { error: "medicalNeed" as const };
  }

  let specialtyId: string | null = null;
  if (checker?.specialtySlug) {
    const specialty = await prisma.specialty.findUnique({
      where: { slug: checker.specialtySlug },
    });
    specialtyId = specialty?.id ?? null;
  }

  await prisma.lead.create({
    data: {
      clinicId: clinic.id,
      fullName: parsed.data.fullName,
      country: parsed.data.country,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      contactMethod: parsed.data.contactMethod,
      arrivalType: parsed.data.arrivalType,
      arrivalDate:
        parsed.data.arrivalType === "undecided"
          ? null
          : parsed.data.arrivalDate || null,
      medicalNeed: usedChecker ? null : parsed.data.medicalNeed,
      symptoms: usedChecker ? checker?.symptoms : null,
      age: usedChecker ? checker?.age : null,
      gender: usedChecker ? checker?.gender : null,
      duration: usedChecker ? checker?.duration : null,
      recommendedSpecialtyId: usedChecker ? specialtyId : null,
    },
  });
  await trackEvent("lead_submit", { clinic: clinic.slug });
  go("/apply/success", locale);
}

export async function recordClinicView(clinicSlug: string) {
  await trackEvent("clinic_view", { clinic: clinicSlug });
}
