import type { ReactNode } from "react";

/** A titled block of fields in an "add" form, two columns on wide screens. */
export function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-line p-4">
      <legend className="px-1 text-xs font-bold uppercase tracking-wide text-primary">{title}</legend>
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
    <label className={`block text-sm font-bold${wide ? " md:col-span-2" : ""}`}>
      {label}
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-xs font-normal text-muted">{hint}</p> : null}
    </label>
  );
}
