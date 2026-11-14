import { useMemo, useState } from "react";
import { submitClinicLead, type LeadPayload } from "@/shared/api/client";
import { createId } from "@/shared/lib/id";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";

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
            <select name="country" className="field" defaultValue="Uzbekistan">
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contact via
            <select name="contactMethod" className="field" defaultValue="whatsapp">
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="phone">Phone call</option>
              <option value="email">Email</option>
            </select>
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
            <select name="arrivalType" className="field" defaultValue="undecided">
              <option value="undecided">Not decided yet</option>
              <option value="approximate">Roughly known</option>
              <option value="exact">Exact dates</option>
            </select>
          </label>
          <label>
            Best time
            <select name="preferredHours" className="field" defaultValue="anytime">
              <option value="anytime">Any time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
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
