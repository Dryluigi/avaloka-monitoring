import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--accent-border)] focus:ring-4 focus:ring-sky-100",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-28 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--accent-border)] focus:ring-4 focus:ring-sky-100",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function ToggleGroup(props: {
  value: string;
  options: {
    value: string;
    label: string;
    description?: string;
    tone?: "default" | "secret";
  }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 rounded-xl border border-[var(--border-soft)] bg-slate-50 p-1 sm:grid-cols-2">
      {props.options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => props.onChange(option.value)}
          className={[
            "rounded-xl border px-3 py-3 text-left transition",
            props.value === option.value
              ? option.tone === "secret"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-[var(--accent-border)] bg-white text-slate-950"
              : "border-transparent text-slate-500 hover:border-[var(--border-soft)] hover:bg-white hover:text-slate-900",
          ].join(" ")}
        >
          <div className="text-sm font-semibold">{option.label}</div>
          {option.description ? (
            <div className="mt-1 text-xs leading-5 text-slate-500">
              {option.description}
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}
