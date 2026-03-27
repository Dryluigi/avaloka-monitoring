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
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border-soft)] bg-slate-50 p-1">
      {props.options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => props.onChange(option.value)}
          className={[
            "rounded-xl px-3 py-2 text-sm font-medium transition",
            props.value === option.value
              ? "bg-white text-slate-950 shadow-[var(--shadow-soft)]"
              : "text-slate-500 hover:text-slate-900",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
