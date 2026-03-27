import type { ReactNode } from "react";

import { STATUS_META } from "../../prototype/config";
import type { FlowStatus } from "../../prototype/types";

export function StatusPill(props: { status: FlowStatus; children: ReactNode }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        STATUS_META[props.status].className,
      ].join(" ")}
    >
      {props.children}
    </span>
  );
}

export function EmptyState(props: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-slate-50/80 px-5 py-10 text-center">
      <h5 className="text-base font-semibold text-slate-900">{props.title}</h5>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {props.body}
      </p>
      {props.actionLabel && props.onAction ? (
        <button
          type="button"
          onClick={props.onAction}
          className="mt-4 rounded-xl border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]"
        >
          {props.actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function SmallEmptyState(props: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-slate-50/70 px-4 py-6 text-sm text-slate-500">
      {props.label}
    </div>
  );
}
