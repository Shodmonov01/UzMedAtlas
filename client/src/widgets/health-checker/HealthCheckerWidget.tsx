import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { analyzeChecker } from "@/shared/api/client";
import { useHealthChecker } from "./HealthCheckerContext";

type CheckerResult = Awaited<ReturnType<typeof analyzeChecker>>;

type ChatMessage =
  | { id: string; role: "operator" | "user"; text: string }
  | { id: string; role: "operator"; kind: "examples" }
  | { id: string; role: "operator"; kind: "result"; result: CheckerResult };

type Step = "symptoms" | "age" | "gender" | "duration" | "loading" | "done";

const GENDER_OPTIONS = [
  { value: "female", label: "Женский" },
  { value: "male", label: "Мужской" },
  { value: "prefer_not", label: "Предпочитаю не указывать" },
] as const;

const DURATION_OPTIONS = [
  { value: "few_days", label: "Несколько дней" },
  { value: "few_weeks", label: "Несколько недель" },
  { value: "few_months", label: "Несколько месяцев" },
  { value: "more_than_year", label: "Больше года" },
] as const;

const EXAMPLES = [
  "Болит колено при ходьбе",
  "Часто болит голова и появляется головокружение",
  "Хочу проверить сердце",
  "Снизилось зрение на одном глазу",
];

const WELCOME: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "operator",
    text: "Здравствуйте! Я Health Checker — помогу подобрать предварительное направление. Это не диагноз.",
  },
  {
    id: "welcome-2",
    role: "operator",
    text: "Опишите, что вас беспокоит, своими словами.",
  },
  { id: "welcome-examples", role: "operator", kind: "examples" },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function HealthCheckerWidget({ showTip = true }: { showTip?: boolean }) {
  const { isOpen, open, close, toggle } = useHealthChecker();
  const panelId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(WELCOME);
  const [step, setStep] = useState<Step>("symptoms");
  const [draft, setDraft] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<"female" | "male" | "prefer_not">("prefer_not");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [isOpen, step]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen, step]);

  function resetChat() {
    setMessages(WELCOME);
    setStep("symptoms");
    setDraft("");
    setSymptoms("");
    setAge(null);
    setGender("prefer_not");
    setError(null);
  }

  async function runAnalyze(
    nextSymptoms: string,
    nextAge: number,
    nextGender: "female" | "male" | "prefer_not",
    nextDuration: "few_days" | "few_weeks" | "few_months" | "more_than_year",
  ) {
    setStep("loading");
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "operator", text: "Смотрю симптомы и подбираю направление…" },
    ]);
    try {
      const result = await analyzeChecker({
        symptoms: nextSymptoms,
        age: nextAge,
        gender: nextGender,
        duration: nextDuration,
        forChild: nextAge < 18,
      });
      const top = result.specialties?.[0];
      sessionStorage.setItem("uma_checker_result", JSON.stringify(result));
      sessionStorage.setItem("uma_last_symptoms", nextSymptoms);
      sessionStorage.setItem(
        "uma_checker_meta",
        JSON.stringify({
          symptoms: nextSymptoms,
          specialtySlug: top?.slug || undefined,
          age: nextAge,
          gender: nextGender,
          duration: nextDuration,
          forChild: nextAge < 18,
        }),
      );
      setMessages((prev) => [...prev, { id: uid(), role: "operator", kind: "result", result }]);
      setStep("done");
    } catch {
      setError("Не удалось проанализировать симптомы. Попробуйте ещё раз.");
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "operator",
          text: "Не получилось обработать запрос. Напишите симптомы ещё раз или выберите пример.",
        },
      ]);
      setStep("symptoms");
    }
  }

  function submitSymptoms(text: string) {
    const cleaned = text.trim();
    if (cleaned.length < 8) {
      setError("Опишите симптомы чуть подробнее (от 8 символов).");
      return;
    }
    setError(null);
    setSymptoms(cleaned);
    setMessages((prev) => [
      ...prev.filter((m) => !("kind" in m && m.kind === "examples")),
      { id: uid(), role: "user", text: cleaned },
      { id: uid(), role: "operator", text: "Сколько вам лет? Можно просто числом." },
    ]);
    setDraft("");
    setStep("age");
  }

  function submitAge(text: string) {
    const nextAge = Number.parseInt(text.trim(), 10);
    if (!Number.isFinite(nextAge) || nextAge < 1 || nextAge > 120) {
      setError("Укажите возраст от 1 до 120.");
      return;
    }
    setError(null);
    setAge(nextAge);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: String(nextAge) },
      { id: uid(), role: "operator", text: "Укажите пол (можно пропустить)." },
    ]);
    setDraft("");
    setStep("gender");
  }

  function submitGender(value: string) {
    const opt = GENDER_OPTIONS.find((o) => o.value === value) || GENDER_OPTIONS[2];
    setGender(opt.value);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: opt.label },
      { id: uid(), role: "operator", text: "Как давно беспокоит?" },
    ]);
    setStep("duration");
  }

  function submitDuration(value: string) {
    const opt = DURATION_OPTIONS.find((o) => o.value === value) || DURATION_OPTIONS[1];
    setMessages((prev) => [...prev, { id: uid(), role: "user", text: opt.label }]);
    void runAnalyze(symptoms, age || 30, gender, opt.value);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step === "symptoms") submitSymptoms(draft);
    else if (step === "age") submitAge(draft);
  }

  const inputDisabled = step === "loading" || step === "done" || step === "gender" || step === "duration";
  const placeholder =
    step === "age"
      ? "Например, 42"
      : step === "done"
        ? "Диалог завершён"
        : step === "gender" || step === "duration"
          ? "Выберите вариант ниже"
          : "Напишите, что беспокоит…";

  return (
    <div className="hc-widget pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <section
          id={panelId}
          role="dialog"
          aria-label="Health Checker"
          aria-modal="false"
          className="hc-panel pointer-events-auto flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_24px_60px_-20px_rgba(31,41,55,0.45)]"
        >
          <header className="flex items-center gap-3 bg-primary-deep px-4 py-3 text-white">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-lg font-extrabold">
              HC
              <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary-deep bg-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">Health Checker</p>
              <p className="truncate text-xs text-white/70">Онлайн · предварительное направление</p>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Свернуть"
              onClick={close}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 12h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div ref={listRef} className="flex max-h-[min(58vh,420px)] flex-col gap-3 overflow-y-auto bg-[#f7f9fc] px-3 py-4">
            {messages.map((message) => {
              if ("kind" in message && message.kind === "examples") {
                return (
                  <div key={message.id} className="flex flex-wrap gap-2 pl-1">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs font-semibold text-ink transition hover:border-primary hover:bg-mint"
                        onClick={() => submitSymptoms(example)}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                );
              }

              if ("kind" in message && message.kind === "result") {
                const top = message.result.specialties?.[0];
                return (
                  <div key={message.id} className="max-w-[92%] space-y-2">
                    <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-3 text-sm shadow-sm ring-1 ring-line">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">Рекомендация</p>
                      <p className="mt-1 text-base font-extrabold text-ink">
                        {top?.nameRu || top?.nameEn || "Уточните у врача"}
                      </p>
                      {message.result.doctorRecommendation ? (
                        <p className="mt-1 text-sm font-semibold text-ink">Специалист: {message.result.doctorRecommendation}</p>
                      ) : null}
                      {(top?.explanationRu || top?.explanationEn) && (
                        <p className="mt-2 text-sm leading-snug text-muted">
                          {top.explanationRu || top.explanationEn}
                        </p>
                      )}
                      {message.result.redFlags?.length ? (
                        <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
                          Обнаружены признаки возможного неотложного состояния. Немедленно обратитесь за экстренной медицинской помощью.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/"
                        search={top?.slug ? { specialty: top.slug } : {}}
                        className="btn btn-primary px-4 py-2 text-sm"
                        onClick={close}
                      >
                        Найти клиники
                      </Link>
                      <button type="button" className="btn btn-ghost px-4 py-2 text-sm" onClick={resetChat}>
                        Ещё раз
                      </button>
                    </div>
                  </div>
                );
              }

              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug shadow-sm ${
                      isUser
                        ? "rounded-tr-md bg-primary text-white"
                        : "rounded-tl-md bg-white text-ink ring-1 ring-line"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}
            {step === "loading" ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-white px-3.5 py-3 ring-1 ring-line">
                  <span className="hc-dot" />
                  <span className="hc-dot" />
                  <span className="hc-dot" />
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line bg-white p-3">
            {error ? <p className="mb-2 text-xs font-semibold text-danger">{error}</p> : null}
            {step === "gender" ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="rounded-full border border-line bg-sand px-3 py-1.5 text-xs font-bold"
                    onClick={() => submitGender(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
            {step === "duration" ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="rounded-full border border-line bg-sand px-3 py-1.5 text-xs font-bold"
                    onClick={() => submitDuration(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <input
                ref={inputRef}
                className="field min-h-11 flex-1 rounded-2xl py-2.5 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                disabled={inputDisabled}
                aria-label="Сообщение для Health Checker"
              />
              <button
                type="submit"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                disabled={inputDisabled || !draft.trim()}
                aria-label="Отправить"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 12L20 4l-6 16-2.5-6.5L4 12z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              Не заменяет консультацию врача. При острых симптомах обратитесь в неотложную помощь.
            </p>
          </form>
        </section>
      ) : null}

      {showTip && !isOpen ? (
        <button
          type="button"
          className="hc-tip pointer-events-auto hidden max-w-[220px] rounded-2xl rounded-br-md bg-white px-3.5 py-2 text-left text-xs font-bold leading-snug text-ink shadow-md ring-1 ring-line sm:block"
          onClick={open}
        >
          Нужна помощь с направлением? Напишите оператору
        </button>
      ) : null}

      <button
        type="button"
        className="hc-fab pointer-events-auto relative grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-[0_16px_40px_-12px_rgba(21,112,239,0.7)] transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Закрыть Health Checker" : "Открыть Health Checker"}
        onClick={toggle}
      >
        {!isOpen ? <span className="hc-fab-pulse" aria-hidden /> : null}
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 11.5C5 7.36 8.58 4 13 4s8 3.36 8 7.5S17.42 19 13 19c-.7 0-1.37-.08-2-.23L7.5 20.5 8.2 17A7.1 7.1 0 0 1 5 11.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold">
              1
            </span>
          </>
        )}
      </button>
    </div>
  );
}
