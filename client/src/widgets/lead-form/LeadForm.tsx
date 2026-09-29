import { useId, useMemo, useState } from "react";
import { submitClinicLead, type LeadPayload } from "@/shared/api/client";
import { createId } from "@/shared/lib/id";

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

export function LeadForm({ clinicSlug, clinicName, defaultSymptoms }: Props) {
  const formId = useId();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => createId());
  const checker = useMemo(() => readCheckerMeta(), []);
  const symptoms = defaultSymptoms || checker?.symptoms || "";
  const fromChecker = Boolean(symptoms || checker?.specialtySlug);

  if (done) {
    return (
      <div className="soft-card rounded-[1.5rem] bg-success-soft p-6 text-sm">
        <p className="font-extrabold text-success">Заявка отправлена</p>
        <p className="mt-2 text-muted">
          Координатор {clinicName} свяжется с вами. Это запрос на обратный звонок, не запись к врачу.
        </p>
      </div>
    );
  }

  return (
    <form
      id={formId}
      className="soft-card space-y-4 rounded-[1.5rem] bg-white p-6"
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
            preferredHours: String(fd.get("preferredHours") || "anytime") as NonNullable<
              LeadPayload["preferredHours"]
            >,
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
          setError("Не удалось отправить. Проверьте телефон в формате +998...");
        } finally {
          setLoading(false);
        }
      }}
    >
      <h2 className="text-xl font-extrabold">Оставить заявку</h2>
      <p className="text-sm text-muted">Координатор клиники свяжется удобным способом.</p>
      {fromChecker ? (
        <p className="rounded-xl bg-mint px-3 py-2 text-xs font-semibold text-primary">
          Заявка с учётом Health Checker
          {checker?.specialtySlug ? ` · направление: ${checker.specialtySlug}` : ""}
        </p>
      ) : null}

      {/* honeypot */}
      <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />

      <label className="block text-sm font-bold">
        Имя
        <input name="fullName" required minLength={2} className="field mt-1" />
      </label>
      <label className="block text-sm font-bold">
        Страна
        <select name="country" className="field mt-1" defaultValue="Uzbekistan">
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-bold">
        Телефон (с кодом страны)
        <input
          name="phone"
          required
          className="field mt-1"
          placeholder="+998901234567"
          defaultValue="+998"
        />
      </label>
      <label className="block text-sm font-bold">
        Email
        <input name="email" type="email" className="field mt-1" />
      </label>
      <label className="block text-sm font-bold">
        Способ связи
        <select name="contactMethod" className="field mt-1" defaultValue="whatsapp">
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
          <option value="phone">Звонок</option>
          <option value="email">Email</option>
        </select>
      </label>
      <label className="block text-sm font-bold">
        Когда планируете приезд
        <select name="arrivalType" className="field mt-1" defaultValue="undecided">
          <option value="undecided">Пока не решил</option>
          <option value="approximate">Примерно</option>
          <option value="exact">Точные даты</option>
        </select>
      </label>
      <label className="block text-sm font-bold">
        Удобное время
        <select name="preferredHours" className="field mt-1" defaultValue="anytime">
          <option value="anytime">Любое</option>
          <option value="morning">Утро</option>
          <option value="afternoon">День</option>
          <option value="evening">Вечер</option>
        </select>
      </label>
      <label className="block text-sm font-bold">
        Что нужно
        <textarea
          name="medicalNeed"
          rows={3}
          className="field mt-1"
          defaultValue={symptoms}
          placeholder="Кратко опишите запрос"
          required={!fromChecker}
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button className="btn btn-primary w-full" type="submit" disabled={loading}>
        {loading ? "Отправка…" : "Отправить заявку"}
      </button>
    </form>
  );
}
