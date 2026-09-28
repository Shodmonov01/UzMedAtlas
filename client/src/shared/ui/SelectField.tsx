import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

type Props = {
  name?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
};

export function SelectField({
  name,
  value,
  options,
  placeholder,
  className = "",
  onChange,
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const label = selected?.label || placeholder || "Выбрать";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`field flex w-full items-center justify-between gap-2 text-left ${
          selected ? "text-ink" : "text-muted"
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 z-40 mt-2 max-h-64 overflow-auto rounded-[1.15rem] border border-line bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(31,41,55,0.45)]"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value || "__empty"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-primary text-white"
                      : "text-ink hover:bg-mint"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
