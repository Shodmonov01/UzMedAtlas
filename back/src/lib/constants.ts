export const CITIES = ["tashkent", "samarkand", "bukhara"] as const;
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

export const LEAD_SOURCES = ["checker", "catalog"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const PREFERRED_HOURS = ["anytime", "morning", "afternoon", "evening"] as const;
export type PreferredHours = (typeof PREFERRED_HOURS)[number];
