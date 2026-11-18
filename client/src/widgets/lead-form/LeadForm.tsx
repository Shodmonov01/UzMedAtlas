import { useMemo, useState } from "react";
import { submitClinicLead, type LeadPayload } from "@/shared/api/client";
import { createId } from "@/shared/lib/id";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { SelectField, type SelectOption } from "@/shared/ui/SelectField";

const COUNTRIES = [
  "Uzbekistan",
  "Kazakhstan",
  "Kyrgyzstan",
  "Tajikistan",
  "Turkmenistan",
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
];

const COUNTRY_OPTIONS: SelectOption[] = COUNTRIES.map((c) => ({ value: c, label: c }));
const CONTACT_OPTIONS: SelectOption[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "phone", label: "Phone call" },
  { value: "email", label: "Email" },
];
const ARRIVAL_OPTIONS: SelectOption[] = [
  { value: "undecided", label: "Not decided yet" },
  { value: "approximate", label: "Roughly known" },
  { value: "exact", label: "Exact dates" },
];
const HOURS_OPTIONS: SelectOption[] = [
  { value: "anytime", label: "Any time" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

type CheckerMeta = {
  symptoms?: string;
  specialtySlug?: string;
  age?: number;
  gender?: "female" | "male" | "prefer_not";
  duration?: "few_days" | "few_weeks" | "few_months" | "more_than_year";
  forChild?: boolean;
};

type Props = {
  clinicSlug: string;
  clinicName: string;
  defaultSymptoms?: string;
  /** How fast the clinic usually replies, in hours. */
  responseHours?: number | null;
};

function readCheckerMeta(): CheckerMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("uma_checker_meta");
    if (!raw) {
      const symptoms = sessionStorage.getItem("uma_last_symptoms");
      return symptoms ? { symptoms } : null;
    }
    return JSON.parse(raw) as CheckerMeta;
  } catch {
    return null;
  }
}

/** The request form on clinic and branch pages: a white card with the fields on paper and the ink send pill.
 *  The request goes to this clinic (its cabinet and Telegram) and to the platform's moderators. */
export function LeadForm({ clinicSlug, clinicName, defaultSymptoms, responseHours }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => createId());
  // The pickers are the site's own (a card on wide screens, a compact sheet on phones) rather than the browser's
  // native select, whose phone dialog is big and plain; each writes its value into a hidden field of the form.
  const [country, setCountry] = useState("Uzbekistan");
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [arrivalType, setArrivalType] = useState("undecided");
  const [preferredHours, setPreferredHours] = useState("anytime");
  const checker = useMemo(() => readCheckerMeta(), []);
  const symptoms = defaultSymptoms || checker?.symptoms || "";
  const fromChecker = Boolean(symptoms || checker?.specialtySlug);

  if (done) {
    return (
      <div id="lead" className="cp-lead cp-lead-done" role="status">
        <span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2>Request sent</h2>
        <p>
          {`A coordinator from ${clinicName} will contact you the way you chose. This is a call-back request, not a booking.`}
        </p>
      </div>
    );
  }

  return (
    <div id="lead" className="cp-lead">
      <div className="cp-lead-head">
        <h2>Send a request</h2>
        <p>
          The request goes to the clinic's coordinator, who will call or message you the way you prefer.
        </p>
      </div>
      {fromChecker ? (
        <p className="cp-lead-note">
          Includes your Health Checker answers
        </p>
      ) : responseHours ? (
        <p className="cp-lead-note">
          {`Usually replies within ${responseHours} h`}
        </p>
      ) : null}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          const fd = new FormData(e.currentTarget);
          try {
            const payload: LeadPayload = {
              fullName: String(fd.get("fullName") || ""),
              country: String(fd.get("country") || "Other"),
              phone: String(fd.get("phone") || ""),
              email: String(fd.get("email") || "") || null,
              contactMethod: String(fd.get("contactMethod") || "whatsapp") as LeadPayload["contactMethod"],
              arrivalType: String(fd.get("arrivalType") || "undecided") as LeadPayload["arrivalType"],
              medicalNeed: String(fd.get("medicalNeed") || "") || null,
              symptoms: symptoms || null,
              preferredHours: String(fd.get("preferredHours") || "anytime") as NonNullable<LeadPayload["preferredHours"]>,
              consent: true,
              idempotencyKey,
              company: String(fd.get("company") || ""),
              source: fromChecker ? "checker" : "catalog",
              specialtySlug: checker?.specialtySlug || null,
              age: checker?.age ?? null,
              gender: checker?.gender ?? null,
              duration: checker?.duration ?? null,
              forChild: Boolean(checker?.forChild),
            };
            await submitClinicLead(clinicSlug, payload);
            setDone(true);
          } catch {
            setError(
              "Could not send. Check the phone number, e.g. +998…",
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        {/* honeypot */}
        <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />

        <label>
          Name
          <input name="fullName" required minLength={2} autoComplete="name" className="field" placeholder="Your name" />
        </label>
        <label>
          Phone with country code
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="field" placeholder="+998901234567" defaultValue="+998" />
        </label>
        <div className="cp-lead-row">
          <label>
            Country
            <SelectField compact name="country" title="Country" value={country} options={COUNTRY_OPTIONS} onChange={setCountry} />
          </label>
          <label>
            Contact via
            <SelectField compact name="contactMethod" title="Contact via" value={contactMethod} options={CONTACT_OPTIONS} onChange={setContactMethod} />
          </label>
        </div>
        <label>
          <span>
            Email <span className="font-medium text-muted">· optional</span>
          </span>
          <input name="email" type="email" autoComplete="email" className="field" placeholder="name@example.com" />
        </label>
        <div className="cp-lead-row">
          <label>
            When you plan to come
            <SelectField compact name="arrivalType" title="When you plan to come" value={arrivalType} options={ARRIVAL_OPTIONS} onChange={setArrivalType} />
          </label>
          <label>
            Best time
            <SelectField compact name="preferredHours" title="Best time" value={preferredHours} options={HOURS_OPTIONS} onChange={setPreferredHours} />
          </label>
        </div>
        <label>
          What you need
          <textarea
            name="medicalNeed"
            rows={4}
            className="field"
            defaultValue={symptoms}
            placeholder="Briefly describe your request: diagnosis, check-up, surgery…"
            required={!fromChecker}
          />
        </label>
        {error ? (
          <p className="cp-lead-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="pill-btn is-ink" type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send request"}
          <span className="pill-btn-icon">
            <ArrowIcon />
          </span>
        </button>
        <p className="cp-lead-fine">
          This is a call-back request, not a booking. Only the clinic and the platform's moderators see your details.
        </p>
      </form>
    </div>
  );
}
