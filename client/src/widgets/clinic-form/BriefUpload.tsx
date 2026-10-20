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
  return <section className="soft-card space-y-4 rounded-2xl bg-white p-5">
    <div><h2 className="text-lg font-extrabold">Заполнить из брифа</h2>
      <p className="mt-1 text-sm text-muted">Загрузите PDF, DOCX или TXT до 5 МБ. Текст будет передан Groq для разбора. Проверьте найденные данные перед применением.</p></div>
    <input type="file" accept=".pdf,.docx,.txt,.md,.csv,.json" disabled={disabled || busy} aria-label="Загрузить бриф клиники" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { setError("Максимальный размер — 5 МБ."); return; }
      setBusy(true); setError(""); setResult(null);
      try { const form = new FormData(); form.append("file", file); const { data } = await api.post<Result>("/api/cabinet/brief", form); setResult(data); }
      catch (err) { const code = (err as { response?: { data?: { error?: string } } }).response?.data?.error || ""; setError(messages[code] || "Не удалось разобрать бриф. Попробуйте ещё раз."); }
      finally { setBusy(false); }
    }} />
    {busy && <p role="status">Обработка…</p>}
    {error && <p role="alert" className="text-danger">{error}</p>}
    {result && <div className="space-y-3">
      <p className="text-sm text-muted">Применение заменит соответствующие поля формы. Остальные данные сохранятся.</p>
      {Object.entries(result.fields).map(([key, value]) => <label key={key} className="block text-sm font-semibold">{fieldLabel(key)}<textarea className="field mt-1" rows={2} value={value} onChange={e => setResult({ ...result, fields: { ...result.fields, [key]: e.target.value } })} /></label>)}
      {result.notes.length > 0 && <div><h3 className="font-bold">Дополнительные сведения для ручного заполнения</h3><ul className="list-disc pl-5">{result.notes.map((note, i) => <li key={i}>{note}</li>)}</ul></div>}
      <button type="button" className="btn btn-primary" disabled={busy || disabled || !Object.keys(result.fields).length} onClick={async () => {
        setBusy(true); setError("");
        try { await onApply(result.fields); setResult(null); }
        catch { setError("Не удалось применить данные. Проверьте поля и повторите."); }
        finally { setBusy(false); }
      }}>Применить данные</button>
    </div>}
  </section>;
}
