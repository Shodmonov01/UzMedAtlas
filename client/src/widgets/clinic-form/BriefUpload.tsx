import { useState } from "react";
import { api } from "@/shared/api/client";

type Result = { fields: Record<string, string>; notes: string[] };
function fieldLabel(key: string) {
  const labels: Record<string, string> = { name: "Название", shortName: "Короткое название", city: "Город", address: "Адрес", description: "Описание", phone: "Телефон", email: "Email", website: "Сайт", whatsapp: "WhatsApp", telegram: "Telegram", instagram: "Instagram", youtube: "YouTube", history: "История", mission: "Миссия", advantages: "Преимущества", founderName: "Основатель", chiefDoctorName: "Главный врач", coordinatorName: "Координатор", whyChoose: "Почему выбирают клинику", popularServices: "Популярные услуги", developmentPlans: "Планы развития", medicalTourism: "Медицинский туризм" };
  const suffix = key.endsWith("Ru") ? " (рус.)" : key.endsWith("En") ? " (англ.)" : "";
  return (labels[suffix ? key.slice(0, -2) : key] || "Сведения о клинике") + suffix;
}
export function BriefUpload({ onApply, disabled }: { onApply: (fields: Record<string, string>) => Promise<void> | void; disabled?: boolean }) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messages: Record<string, string> = {
    groq_not_configured: "На сервере не настроен ключ Groq.",
    empty_brief: "В файле нет текста. Для скана нужен PDF с распознанным текстом.",
    unreadable_brief: "Не удалось прочитать файл. Используйте PDF с текстом, DOCX или TXT.",
    brief_too_long: "Бриф слишком длинный: максимум 80 000 символов.",
    rate_limit: "Лимит разборов исчерпан. Попробуйте позже.",
  };
  return <section className="ws-card is-pad space-y-4">
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: "var(--brand-gradient)" }} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <div className="min-w-0"><h2 className="ws-card-title">Заполнить из брифа</h2>
      <p className="ws-card-text">Есть бриф или презентация клиники? Загрузите PDF, DOCX или TXT до 5 МБ — поля заполнятся сами. Текст разбирает Groq; проверьте данные перед применением.</p></div>
    </div>
    <input type="file" accept=".pdf,.docx,.txt,.md,.csv,.json" disabled={disabled || busy} aria-label="Загрузить бриф клиники" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { setError("Максимальный размер — 5 МБ."); return; }
      setBusy(true); setError(""); setResult(null);
      try { const form = new FormData(); form.append("file", file); const { data } = await api.post<Result>("/api/cabinet/brief", form); setResult(data); }
      catch (err) { const code = (err as { response?: { data?: { error?: string } } }).response?.data?.error || ""; setError(messages[code] || "Не удалось разобрать бриф. Попробуйте ещё раз."); }
      finally { setBusy(false); }
    }} />
    {busy && <p role="status" className="text-sm font-semibold text-muted">Разбираем бриф…</p>}
    {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
    {result && <div className="ws-group">
      <p className="text-sm text-muted">Применение заменит соответствующие поля формы. Остальные данные сохранятся.</p>
      {Object.entries(result.fields).map(([key, value]) => <label key={key} className="ws-field"><span className="ws-field-label">{fieldLabel(key)}</span><textarea className="field" rows={2} value={value} onChange={e => setResult({ ...result, fields: { ...result.fields, [key]: e.target.value } })} /></label>)}
      {result.notes.length > 0 && <div><h3 className="text-sm font-bold text-ink">Дополнительные сведения для ручного заполнения</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{result.notes.map((note, i) => <li key={i}>{note}</li>)}</ul></div>}
      <button type="button" className="btn btn-primary justify-self-start" disabled={busy || disabled || !Object.keys(result.fields).length} onClick={async () => {
        setBusy(true); setError("");
        try { await onApply(result.fields); setResult(null); }
        catch { setError("Не удалось применить данные. Проверьте поля и повторите."); }
        finally { setBusy(false); }
      }}>Применить данные</button>
    </div>}
  </section>;
}
