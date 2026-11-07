import type { ReactNode } from "react";

/** A titled block of fields in an "add" form: a paper panel with a small green label, two columns on wide screens. */
export function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="ws-group">
      <legend>{title}</legend>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** A form control with its name above and an optional hint below. */
export function Field({
  label,
  hint,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  /** Spans both columns of a two-column grid. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`ws-field${wide ? " md:col-span-2" : ""}`}>
      <span className="ws-field-label">{label}</span>
      {children}
      {hint ? <span className="ws-field-hint">{hint}</span> : null}
    </label>
  );
}
