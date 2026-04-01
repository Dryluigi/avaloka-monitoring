import type { ReactNode } from "react";

export function StatCard(props: {
  label: string;
  value: string;
  tone?: "blue" | "teal" | "rose" | "amber" | "slate";
}) {
  const tone = props.tone ?? "slate";
  const toneClass =
    tone === "blue"
      ? "border-sky-200 bg-sky-50"
      : tone === "teal"
        ? "border-teal-200 bg-teal-50"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50"
          : tone === "amber"
            ? "border-amber-200 bg-amber-50"
            : "border-[var(--border-soft)] bg-white";

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{props.label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{props.value}</div>
    </div>
  );
}

export function Metric(props: {
  label: string;
  value: string;
  tone?: "blue" | "teal" | "rose" | "amber" | "slate";
  valueClassName?: string;
}) {
  const tone = props.tone ?? "slate";
  const toneClass =
    tone === "blue"
      ? "border-sky-200 bg-sky-100"
      : tone === "teal"
        ? "border-teal-200 bg-teal-100"
        : tone === "rose"
          ? "border-rose-200 bg-rose-100"
          : tone === "amber"
            ? "border-amber-200 bg-amber-100"
            : "border-slate-200 bg-slate-100";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{props.label}</div>
      <div
        className={[
          "mt-1 text-sm font-medium text-slate-800",
          props.valueClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {props.value}
      </div>
    </div>
  );
}

export function MetricPanel(props: {
  label: string;
  value: string;
  tone?: "blue" | "teal" | "rose" | "amber" | "slate";
}) {
  const tone = props.tone ?? "slate";
  const toneClass =
    tone === "blue"
      ? "border-sky-200 bg-sky-50"
      : tone === "teal"
        ? "border-teal-200 bg-teal-50"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50"
          : tone === "amber"
            ? "border-amber-200 bg-amber-50"
            : "border-[var(--border-soft)] bg-white";

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{props.label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{props.value}</div>
    </div>
  );
}

export function IconStatCard(props: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "teal";
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        props.tone === "teal"
          ? "border-teal-200 bg-teal-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          props.tone === "teal"
            ? "bg-teal-100 text-teal-700"
            : "bg-slate-100 text-slate-500",
        ].join(" ")}
      >
        {props.icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
          {props.label}
        </div>
        <div className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
          {props.value}
        </div>
      </div>
    </div>
  );
}
