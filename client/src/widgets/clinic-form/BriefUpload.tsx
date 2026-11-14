import { useState } from "react";
import { api } from "@/shared/api/client";

type Result = { fields: Record<string, string>; notes: string[] };
function fieldLabel(key: string) {
  const labels: Record<string, string> = { name: "Name", shortName: "Short name", city: "City", address: "Address", description: "Description", phone: "Phone", email: "Email", website: "Website", whatsapp: "WhatsApp", telegram: "Telegram", instagram: "Instagram", youtube: "YouTube", history: "History", mission: "Mission", advantages: "Advantages", founderName: "Founder", chiefDoctorName: "Chief physician", coordinatorName: "Coordinator", whyChoose: "Why patients choose the clinic", popularServices: "Popular services", developmentPlans: "Development plans", medicalTourism: "Medical tourism" };
  const suffix = key.endsWith("Ru") ? " (RU)" : key.endsWith("En") ? " (EN)" : "";
  return (labels[suffix ? key.slice(0, -2) : key] || "Clinic details") + suffix;
}
export function BriefUpload({ onApply, disabled }: { onApply: (fields: Record<string, string>) => Promise<void> | void; disabled?: boolean }) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messages: Record<string, string> = {
    groq_not_configured: "The Groq key is not set up on the server.",
    empty_brief: "The file has no text. A scan needs to be a PDF with recognised text.",
    unreadable_brief: "Could not read the file. Use a PDF with text, DOCX or TXT.",
    brief_too_long: "The brief is too long: 80,000 characters at most.",
    rate_limit: "The parsing limit is used up. Try again later.",
  };
  return <section className="ws-card is-pad space-y-4">
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: "var(--brand-gradient)" }} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <div className="min-w-0"><h2 className="ws-card-title">Fill in from a brief</h2>
      <p className="ws-card-text">Have a brief or a presentation of the clinic? Upload a PDF, DOCX or TXT up to 5 MB and the fields fill in by themselves. Groq reads the text; check the data before applying it.</p></div>
    </div>
    <input type="file" accept=".pdf,.docx,.txt,.md,.csv,.json" disabled={disabled || busy} aria-label="Upload the clinic brief" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { setError("The maximum size is 5 MB."); return; }
      setBusy(true); setError(""); setResult(null);
      try { const form = new FormData(); form.append("file", file); const { data } = await api.post<Result>("/api/cabinet/brief", form); setResult(data); }
      catch (err) { const code = (err as { response?: { data?: { error?: string } } }).response?.data?.error || ""; setError(messages[code] || "Could not parse the brief. Please try again."); }
      finally { setBusy(false); }
    }} />
    {busy && <p role="status" className="text-sm font-semibold text-muted">Reading the brief…</p>}
    {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
    {result && <div className="ws-group">
      <p className="text-sm text-muted">Applying replaces the matching form fields. Everything else stays as it is.</p>
      {Object.entries(result.fields).map(([key, value]) => <label key={key} className="ws-field"><span className="ws-field-label">{fieldLabel(key)}</span><textarea className="field" rows={2} value={value} onChange={e => setResult({ ...result, fields: { ...result.fields, [key]: e.target.value } })} /></label>)}
      {result.notes.length > 0 && <div><h3 className="text-sm font-bold text-ink">Extra details to fill in by hand</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{result.notes.map((note, i) => <li key={i}>{note}</li>)}</ul></div>}
      <button type="button" className="btn btn-primary justify-self-start" disabled={busy || disabled || !Object.keys(result.fields).length} onClick={async () => {
        setBusy(true); setError("");
        try { await onApply(result.fields); setResult(null); }
        catch { setError("Could not apply the data. Check the fields and try again."); }
        finally { setBusy(false); }
      }}>Apply data</button>
    </div>}
  </section>;
}
