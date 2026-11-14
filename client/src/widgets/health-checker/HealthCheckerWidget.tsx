import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { analyzeChecker } from "@/shared/api/client";
import { useHealthChecker } from "./HealthCheckerContext";
import { pickName } from "@/shared/i18n/lang";

type CheckerResult = Awaited<ReturnType<typeof analyzeChecker>>;

type ChatMessage =
  | { id: string; role: "operator" | "user"; text: string }
  | { id: string; role: "operator"; kind: "examples" }
  | { id: string; role: "operator"; kind: "result"; result: CheckerResult };

type Step = "symptoms" | "age" | "gender" | "duration" | "loading" | "done";

const GENDER_OPTIONS: readonly { value: "female" | "male" | "prefer_not"; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "prefer_not", label: "Prefer not to say" },
];

const DURATION_OPTIONS: readonly { value: "few_days" | "few_weeks" | "few_months" | "more_than_year"; label: string }[] = [
  { value: "few_days", label: "A few days" },
  { value: "few_weeks", label: "A few weeks" },
  { value: "few_months", label: "A few months" },
  { value: "more_than_year", label: "Over a year" },
];

const EXAMPLES: string[] = [
  "My knee hurts when I walk",
  "I often have headaches and dizziness",
  "I want to check my heart",
  "My sight got worse in one eye",
];

/** The chat's own lines in every language. */
const L = {
  hello: "Hello! I am Health Checker and I will help you find a preliminary specialty. This is not a diagnosis.",
  describe: "Describe what bothers you in your own words.",
  analyzing: "Looking at the symptoms and choosing a specialty…",
  failed: "Could not analyse the symptoms. Please try again.",
  failedChat: "The request could not be processed. Write the symptoms again or pick an example.",
  tooShort: "Describe the symptoms in a bit more detail (8 characters or more).",
  askAge: "How old are you? A number is enough.",
  badAge: "Enter an age from 1 to 120.",
  askGender: "Your sex (you can skip this).",
  askDuration: "How long has it bothered you?",
} satisfies Record<string, string>;

const welcome = (): ChatMessage[] => [
  { id: "welcome-1", role: "operator", text: L.hello },
  { id: "welcome-2", role: "operator", text: L.describe },
  { id: "welcome-examples", role: "operator", kind: "examples" },
];

/** The checker's mark: a solid heart with a pulse line cut out of it, in the manner of the iPhone's system symbols. */
function HeartGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 21.2c-.3 0-.5-.1-.7-.2C7.4 18.4 2.5 14.6 2.5 9.4 2.5 6.2 4.9 3.8 8 3.8c1.6 0 3 .8 4 2 1-1.2 2.4-2 4-2 3.1 0 5.5 2.4 5.5 5.6 0 5.2-4.9 9-8.8 11.6-.2.1-.4.2-.7.2Z" />
      <path d="M6.5 11.2h2.6l1.4-2.6 2.3 5 1.6-2.4h3.1" fill="none" stroke="var(--paper)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function HealthCheckerWidget({ showTip = true, hideOverHero = false }: { showTip?: boolean; hideOverHero?: boolean }) {
  const { isOpen, open, close, toggle } = useHealthChecker();
  const panelId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => welcome());
  const [step, setStep] = useState<Step>("symptoms");
  const [draft, setDraft] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<"female" | "male" | "prefer_not">("prefer_not");
  const [error, setError] = useState<string | null>(null);
  // On the home page the launcher stays out of the hero film and shows up once the film is scrolled past.
  const [overHero, setOverHero] = useState(hideOverHero);

  useEffect(() => {
    if (!hideOverHero) {
      setOverHero(false);
      return;
    }
    const update = () => setOverHero(window.scrollY < window.innerHeight - 80);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [hideOverHero]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [isOpen, step]);

  // On phones the open chat covers the page, so a real swipe of the page past it closes the chat. Only a finger moving
  // on the page counts: the keyboard opening (typing in the chat) also scrolls the page, and that must not close it.
  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 767px)").matches) return;
    let startY: number | null = null;
    const onStart = (event: TouchEvent) => {
      const insideChat = (event.target as Element | null)?.closest(".hc-widget");
      startY = insideChat ? null : event.touches[0].clientY;
    };
    const onMove = (event: TouchEvent) => {
      if (startY === null || Math.abs(event.touches[0].clientY - startY) < 40) return;
      startY = null;
      if (document.activeElement?.closest(".hc-widget")) (document.activeElement as HTMLElement).blur();
      close();
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen, step]);

  function resetChat() {
    setMessages(welcome());
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
      { id: uid(), role: "operator", text: L.analyzing },
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
      setError(L.failed);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "operator",
          text: L.failedChat,
        },
      ]);
      setStep("symptoms");
    }
  }

  function submitSymptoms(text: string) {
    const cleaned = text.trim();
    if (cleaned.length < 8) {
      setError(L.tooShort);
      return;
    }
    setError(null);
    setSymptoms(cleaned);
    setMessages((prev) => [
      ...prev.filter((m) => !("kind" in m && m.kind === "examples")),
      { id: uid(), role: "user", text: cleaned },
      { id: uid(), role: "operator", text: L.askAge },
    ]);
    setDraft("");
    setStep("age");
  }

  function submitAge(text: string) {
    const nextAge = Number.parseInt(text.trim(), 10);
    if (!Number.isFinite(nextAge) || nextAge < 1 || nextAge > 120) {
      setError(L.badAge);
      return;
    }
    setError(null);
    setAge(nextAge);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: String(nextAge) },
      { id: uid(), role: "operator", text: L.askGender },
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
      { id: uid(), role: "operator", text: L.askDuration },
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
      ? "For example, 42"
      : step === "done"
        ? "Conversation finished"
        : step === "gender" || step === "duration"
          ? "Pick an option below"
          : "Write what bothers you…";

  return (
    <div className={`hc-widget pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6${overHero && !isOpen ? " is-tucked" : ""}`}>
      {isOpen ? (
        <section
          id={panelId}
          role="dialog"
          aria-label="Health Checker"
          aria-modal="false"
          className="hc-panel pointer-events-auto flex w-[min(100vw-2rem,390px)] flex-col gap-1.5 overflow-hidden rounded-[26px] bg-white p-2 shadow-[0_0_0_1px_#0b2a3d0f,0_30px_70px_-24px_rgba(11,42,61,0.55)]"
        >
          <header className="flex items-center gap-2.5 px-2 pb-1 pt-2 text-ink">
            <span className="hc-tile" aria-hidden>
              <HeartGlyph />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold tracking-tight">Health Checker</p>
              <p className="truncate text-xs text-muted">Preliminary specialty · not a diagnosis</p>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full bg-paper text-ink transition hover:bg-[#e6eeee]"
              aria-label="Minimise"
              onClick={close}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 12h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div ref={listRef} className="flex max-h-[min(58vh,420px)] flex-col gap-2.5 overflow-y-auto rounded-[18px] bg-paper px-3 py-3.5">
            {messages.map((message) => {
              if ("kind" in message && message.kind === "examples") {
                return (
                  <div key={message.id} className="flex flex-wrap gap-2 pl-1">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        className="rounded-full bg-white px-3 py-1.5 text-left text-xs font-semibold text-ink ring-1 ring-line transition hover:bg-ink hover:text-white hover:ring-ink"
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
                    <div className="rounded-[16px] rounded-bl-md bg-white px-4 py-3.5 text-sm ring-1 ring-[#0b2a3d0d]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Recommendation</p>
                      <p className="mt-1.5 text-lg font-semibold tracking-tight text-accent-deep">
                        {pickName(top?.nameRu, top?.nameEn) || "Ask a doctor"}
                      </p>
                      {message.result.doctorRecommendation ? (
                        <p className="mt-1 text-sm font-semibold text-ink">Specialist: {message.result.doctorRecommendation}</p>
                      ) : null}
                      {(top?.explanationRu || top?.explanationEn) && (
                        <p className="mt-2 text-sm leading-snug text-muted">
                          {pickName(top.explanationRu, top.explanationEn)}
                        </p>
                      )}
                      {message.result.redFlags?.length ? (
                        <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
                          Signs of a possible emergency were found. Seek emergency medical help right away.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/"
                        search={top?.slug ? { specialty: top.slug } : {}}
                        // Straight to the clinic list, not back to the top of the home page.
                        hash="clinic-results"
                        resetScroll={false}
                        className="hc-action"
                        onClick={close}
                      >
                        Find clinics
                      </Link>
                      <button type="button" className="hc-action is-ghost" onClick={resetChat}>
                        Start over
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
                    className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? "rounded-br-md bg-ink text-white"
                        : "rounded-bl-md bg-white text-ink ring-1 ring-[#0b2a3d0d]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}
            {step === "loading" ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-[16px] rounded-bl-md bg-white px-4 py-3.5 ring-1 ring-[#0b2a3d0d]">
                  <span className="hc-dot" />
                  <span className="hc-dot" />
                  <span className="hc-dot" />
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="rounded-[18px] bg-paper p-2">
            {error ? <p className="mb-2 px-2 pt-1 text-xs font-semibold text-danger">{error}</p> : null}
            {step === "gender" ? (
              <div className="mb-2 flex flex-wrap gap-1.5 px-1 pt-1">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="hc-option"
                    onClick={() => submitGender(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
            {step === "duration" ? (
              <div className="mb-2 flex flex-wrap gap-1.5 px-1 pt-1">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="hc-option"
                    onClick={() => submitDuration(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="hc-composer">
              <input
                ref={inputRef}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                disabled={inputDisabled}
                aria-label="Message to Health Checker"
              />
              <button
                type="submit"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:bg-[#134058] disabled:cursor-not-allowed disabled:opacity-30"
                disabled={inputDisabled || !draft.trim()}
                aria-label="Send"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 20.5a1.3 1.3 0 0 1-1.3-1.3V8.1l-3.9 3.9a1.3 1.3 0 1 1-1.8-1.8l6.1-6.1a1.3 1.3 0 0 1 1.8 0l6.1 6.1a1.3 1.3 0 1 1-1.8 1.8l-3.9-3.9v11.1a1.3 1.3 0 0 1-1.3 1.3Z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 px-2 pb-1 text-[11px] leading-snug text-muted">
              This does not replace a doctor's advice. With acute symptoms, seek emergency care.
            </p>
          </form>
        </section>
      ) : null}

      {showTip && !isOpen ? (
        <button
          type="button"
          className="hc-tip pointer-events-auto hidden max-w-[240px] rounded-[16px] rounded-br-md bg-white px-4 py-3 text-left text-[13px] font-semibold leading-snug text-ink shadow-[0_16px_36px_-20px_rgba(11,42,61,0.5)] ring-1 ring-[#0b2a3d0f] sm:block"
          onClick={open}
        >
          Need help choosing a specialty? Write to us
        </button>
      ) : null}

      <button
        type="button"
        className="hc-fab pointer-events-auto relative grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-[0_18px_40px_-14px_rgba(11,42,61,0.7)] transition hover:bg-[#134058] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close Health Checker" : "Open Health Checker"}
        onClick={toggle}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 3.5c-5 0-9 3.4-9 7.7 0 2.4 1.3 4.6 3.3 6-.2 1.2-.8 2.4-1.7 3.3 2 0 3.7-.7 4.9-1.7.8.2 1.6.3 2.5.3 5 0 9-3.4 9-7.9S17 3.5 12 3.5Z" />
              <path d="M8 11.3h.01M12 11.3h.01M16 11.3h.01" stroke="#0b2a3d" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-accent ring-2 ring-[#0b2a3d]" aria-hidden />
          </>
        )}
      </button>
    </div>
  );
}
