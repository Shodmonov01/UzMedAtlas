import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Send, X } from "lucide-react";
import { api } from "../api";
import { useLocale, withLocale } from "../locale-link";
import { DoctorPortrait } from "./DoctorPortrait";

type ChatMsg = { id: string; from: "leyla" | "you"; text: string };

function intentOf(text: string) {
  const n = text.toLowerCase();
  if (/(каталог|clinic|клиник|skip|пропуст|просто посмотр)/.test(n)) return "catalog";
  if (/(диагноз|diagnos|вы врач|are you a doctor|это лечение)/.test(n)) return "diagnosis";
  if (/(как это|how does|how it work|что это за сайт|what is this)/.test(n)) return "how";
  if (/(цена|price|сколько стоит|cost)/.test(n)) return "price";
  if (text.trim().length < 8) return "short";
  return "symptoms";
}

export function OperatorChat() {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.replace(/^\/(en|ru)/, "") || "/";
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  const isHome = path === "/";

  useEffect(() => {
    if (!isHome) {
      setPeek(false);
      return;
    }
    const timer = window.setTimeout(() => setPeek(true), 1100);
    return () => window.clearTimeout(timer);
  }, [isHome]);

  useEffect(() => {
    function openChat() {
      setOpen(true);
      setPeek(false);
    }
    window.addEventListener("uma-open-chat", openChat);
    return () => window.removeEventListener("uma-open-chat", openChat);
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: "hello", from: "leyla", text: t("operator.hello") }]);
    }
  }, [open, messages.length, t]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 767px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function push(from: ChatMsg["from"], text: string) {
    setMessages((current) => [...current, { id: `${Date.now()}-${current.length}`, from, text }]);
  }

  function leylaSay(text: string) {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      push("leyla", text);
    }, 650);
  }

  async function startChecker(symptoms: string) {
    setPending(true);
    try {
      await api.post("/api/checker/start", { symptoms });
      navigate(withLocale(locale, "/checker"));
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  async function skipToCatalog() {
    setPending(true);
    try {
      await api.post("/api/checker/skip");
      navigate(withLocale(locale, "/clinics"));
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  function answer(text: string) {
    const intent = intentOf(text);
    if (intent === "catalog") {
      leylaSay(t("operator.showClinicsReply"));
      window.setTimeout(() => {
        skipToCatalog();
      }, 700);
      return;
    }
    if (intent === "diagnosis") {
      leylaSay(t("operator.notDiagnosis"));
      return;
    }
    if (intent === "how") {
      leylaSay(t("operator.how"));
      return;
    }
    if (intent === "price") {
      leylaSay(t("operator.price"));
      return;
    }
    if (intent === "short") {
      leylaSay(t("operator.moreDetail"));
      return;
    }
    leylaSay(t("operator.gotIt"));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (text.length < 1 || pending) return;
    setInput("");
    push("you", text);
    answer(text);
  }

  const lastYours = [...messages].reverse().find((item) => item.from === "you")?.text ?? "";
  const canFind = lastYours.trim().length >= 8 && intentOf(lastYours) === "symptoms";
  const chips = t("operator.chips", { returnObjects: true }) as string[];

  return (
    <>
      {open ? (
        <button
          type="button"
          className="operator-backdrop"
          aria-label={t("operator.close")}
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="operator-dock">
        {open ? (
          <section className="operator-panel" role="dialog" aria-modal="true" aria-label={t("operator.open")}>
            <header className="operator-head">
              <DoctorPortrait className="h-12 w-12 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold leading-tight">{t("operator.name")}</p>
                <p className="text-xs font-bold text-lime">
                  <span className="operator-dot" /> {t("operator.online")} · {t("operator.role")}
                </p>
              </div>
              <button type="button" className="operator-icon-btn" onClick={() => setOpen(false)} aria-label={t("operator.close")}>
                <X size={18} />
              </button>
            </header>
            <div ref={scroller} className="operator-thread">
              {messages.map((item) => (
                <p key={item.id} className={item.from === "leyla" ? "bubble-in" : "bubble-out"}>
                  {item.text}
                </p>
              ))}
              {typing ? <p className="bubble-in bubble-typing">{t("operator.typing")}</p> : null}
              <div className="flex flex-wrap gap-2 pt-1">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="chip bg-white"
                    onClick={() => {
                      if (pending || typing) return;
                      push("you", chip);
                      answer(chip);
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              {canFind || lastYours ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {canFind ? (
                    <button className="btn btn-primary text-sm" type="button" disabled={pending} onClick={() => startChecker(lastYours)}>
                      {t("operator.findSpecialty")}
                    </button>
                  ) : null}
                  <button className="btn btn-ghost text-sm" type="button" disabled={pending} onClick={skipToCatalog}>
                    {t("operator.showClinics")}
                  </button>
                </div>
              ) : null}
            </div>
            <form onSubmit={onSubmit} className="operator-compose">
              <input
                ref={field}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("operator.placeholder")}
                className="operator-input"
                maxLength={1500}
              />
              <button className="operator-send" type="submit" disabled={pending || !input.trim()} aria-label={t("operator.send")}>
                <Send size={18} />
              </button>
            </form>
            <p className="operator-note">{t("operator.disclaimer")}</p>
          </section>
        ) : null}

        {!open ? (
          <div className="operator-launch">
            {peek ? (
              <button type="button" className="operator-peek" onClick={() => setOpen(true)}>
                {t("operator.peek")}
              </button>
            ) : null}
            <button
              type="button"
              className="operator-fab"
              onClick={() => {
                setOpen(true);
                setPeek(false);
              }}
              aria-label={t("operator.open")}
            >
              <DoctorPortrait className="h-full w-full" />
              <span className="operator-fab-dot" />
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
