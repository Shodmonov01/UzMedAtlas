export const CITIES = [
  "tashkent",
  "samarkand",
  "bukhara",
  "andijan",
  "fergana",
  "namangan",
  "nukus",
  "qarshi",
  "termez",
  "urgench",
  "jizzakh",
  "navoi",
  "kokand",
  "margilan",
  "gulistan",
] as const;
export type City = (typeof CITIES)[number];

export const CONTACT_METHODS = [
  "whatsapp",
  "telegram",
  "phone",
  "email",
] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const ARRIVAL_TYPES = ["exact", "approximate", "undecided"] as const;
export type ArrivalType = (typeof ARRIVAL_TYPES)[number];

export const GENDERS = ["female", "male", "prefer_not"] as const;
export type Gender = (typeof GENDERS)[number];

export const DURATIONS = [
  "few_days",
  "few_weeks",
  "few_months",
  "more_than_year",
] as const;
export type Duration = (typeof DURATIONS)[number];

export const SERVICE_LANGUAGES = ["en", "ru", "uz", "kz", "tr", "ar"] as const;

export const COUNTRIES = [
  "Kazakhstan",
  "Kyrgyzstan",
  "Tajikistan",
  "Turkmenistan",
  "Uzbekistan",
  "Russia",
  "Turkey",
  "United Arab Emirates",
  "India",
  "China",
  "South Korea",
  "Germany",
  "United Kingdom",
  "United States",
  "Other",
] as const;

export const LEAD_STATUSES = ["new", "contacted", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** AMO §3 clinic lifecycle */
export const CLINIC_STATUSES = [
  "draft",
  "moderation",
  "needs_changes",
  "approved",
  "published",
] as const;
export type ClinicStatus = (typeof CLINIC_STATUSES)[number];

export const PHOTO_CATEGORIES = [
  "facade",
  "reception",
  "hall",
  "waiting",
  "rooms",
  "or",
  "equipment",
  "staff",
  "leadership",
  "patients",
  "team",
  "other",
] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const LEAD_SOURCES = ["checker", "catalog"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const PREFERRED_HOURS = ["anytime", "morning", "afternoon", "evening"] as const;
export type PreferredHours = (typeof PREFERRED_HOURS)[number];
