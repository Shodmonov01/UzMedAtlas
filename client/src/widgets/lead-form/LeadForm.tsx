import { useMemo, useState } from "react";
import { submitClinicLead, type LeadPayload } from "@/shared/api/client";
import { createId } from "@/shared/lib/id";
import { useLang } from "@/shared/i18n/lang";
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
  const { t } = useLang();
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
        <h2>{t({ ru: "Заявка отправлена", uz: "Ariza yuborildi", en: "Request sent" })}</h2>
        <p>
          {t({
            ru: `Координатор клиники «${clinicName}» свяжется с вами выбранным способом. Это запрос на обратный звонок, а не запись к врачу.`,
            uz: `«${clinicName}» klinikasi koordinatori siz tanlagan usulda bogʻlanadi. Bu qayta qoʻngʻiroq soʻrovi, shifokorga yozilish emas.`,
            en: `A coordinator from ${clinicName} will contact you the way you chose. This is a call-back request, not a booking.`,
          })}
        </p>
      </div>
    );
  }

  return (
    <div id="lead" className="cp-lead">
      <div className="cp-lead-head">
        <h2>{t({ ru: "Оставить заявку", uz: "Ariza qoldirish", en: "Send a request" })}</h2>
        <p>
          {t({
            ru: "Заявка придёт координатору клиники — он перезвонит или напишет удобным способом.",
            uz: "Ariza klinika koordinatoriga boradi — u qulay usulda qoʻngʻiroq qiladi yoki yozadi.",
            en: "The request goes to the clinic's coordinator, who will call or message you the way you prefer.",
          })}
        </p>
      </div>
      {fromChecker ? (
        <p className="cp-lead-note">
          {t({ ru: "Заявка с учётом ваших ответов в Health Checker", uz: "Ariza Health Checker javoblaringiz bilan", en: "Includes your Health Checker answers" })}
        </p>
      ) : responseHours ? (
        <p className="cp-lead-note">
          {t({ ru: `Обычно отвечают за ${responseHours} ч`, uz: `Odatda ${responseHours} soatda javob berishadi`, en: `Usually replies within ${responseHours} h` })}
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
              t({
                ru: "Не удалось отправить. Проверьте телефон в формате +998…",
                uz: "Yuborib boʻlmadi. Telefonni +998… formatida tekshiring",
                en: "Could not send. Check the phone number, e.g. +998…",
              }),
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        {/* honeypot */}
        <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />

        <label>
          {t({ ru: "Имя", uz: "Ism", en: "Name" })}
          <input name="fullName" required minLength={2} autoComplete="name" className="field" placeholder={t({ ru: "Как к вам обращаться", uz: "Sizga qanday murojaat qilaylik", en: "Your name" })} />
        </label>
        <label>
          {t({ ru: "Телефон с кодом страны", uz: "Telefon (mamlakat kodi bilan)", en: "Phone with country code" })}
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="field" placeholder="+998901234567" defaultValue="+998" />
        </label>
        <div className="cp-lead-row">
          <label>
            {t({ ru: "Страна", uz: "Mamlakat", en: "Country" })}
            <select name="country" className="field" defaultValue="Uzbekistan">
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t({ ru: "Как связаться", uz: "Aloqa usuli", en: "Contact via" })}
            <select name="contactMethod" className="field" defaultValue="whatsapp">
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="phone">{t({ ru: "Звонок", uz: "Qoʻngʻiroq", en: "Phone call" })}</option>
              <option value="email">Email</option>
            </select>
          </label>
        </div>
        <label>
          <span>
            Email <span className="font-medium text-muted">{t({ ru: "· необязательно", uz: "· ixtiyoriy", en: "· optional" })}</span>
          </span>
          <input name="email" type="email" autoComplete="email" className="field" placeholder="name@example.com" />
        </label>
        <div className="cp-lead-row">
          <label>
            {t({ ru: "Сроки приезда", uz: "Kelish muddati", en: "When you plan to come" })}
            <select name="arrivalType" className="field" defaultValue="undecided">
              <option value="undecided">{t({ ru: "Пока не решил", uz: "Hali hal qilmadim", en: "Not decided yet" })}</option>
              <option value="approximate">{t({ ru: "Примерно знаю", uz: "Taxminan bilaman", en: "Roughly known" })}</option>
              <option value="exact">{t({ ru: "Точные даты", uz: "Aniq sanalar", en: "Exact dates" })}</option>
            </select>
          </label>
          <label>
            {t({ ru: "Удобное время", uz: "Qulay vaqt", en: "Best time" })}
            <select name="preferredHours" className="field" defaultValue="anytime">
              <option value="anytime">{t({ ru: "Любое", uz: "Istalgan", en: "Any time" })}</option>
              <option value="morning">{t({ ru: "Утро", uz: "Ertalab", en: "Morning" })}</option>
              <option value="afternoon">{t({ ru: "День", uz: "Kunduzi", en: "Afternoon" })}</option>
              <option value="evening">{t({ ru: "Вечер", uz: "Kechqurun", en: "Evening" })}</option>
            </select>
          </label>
        </div>
        <label>
          {t({ ru: "Что нужно", uz: "Nima kerak", en: "What you need" })}
          <textarea
            name="medicalNeed"
            rows={4}
            className="field"
            defaultValue={symptoms}
            placeholder={t({ ru: "Кратко опишите запрос: диагноз, обследование, операция…", uz: "Soʻrovni qisqacha yozing: tashxis, tekshiruv, operatsiya…", en: "Briefly describe your request: diagnosis, check-up, surgery…" })}
            required={!fromChecker}
          />
        </label>
        {error ? (
          <p className="cp-lead-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="pill-btn is-ink" type="submit" disabled={loading}>
          {loading ? t({ ru: "Отправляем…", uz: "Yuborilmoqda…", en: "Sending…" }) : t({ ru: "Отправить заявку", uz: "Arizani yuborish", en: "Send request" })}
          <span className="pill-btn-icon">
            <ArrowIcon />
          </span>
        </button>
        <p className="cp-lead-fine">
          {t({
            ru: "Это запрос на обратный звонок, а не запись к врачу. Данные увидят только клиника и модераторы платформы.",
            uz: "Bu qayta qoʻngʻiroq soʻrovi, shifokorga yozilish emas. Maʼlumotlarni faqat klinika va platforma moderatorlari koʻradi.",
            en: "This is a call-back request, not a booking. Only the clinic and the platform's moderators see your details.",
          })}
        </p>
      </form>
    </div>
  );
}
