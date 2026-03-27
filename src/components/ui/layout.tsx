import type { ReactNode } from "react";

import { ActionButton } from "./buttons";

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{props.label}</div>
      {props.children}
    </label>
  );
}

export function CardSection(props: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-slate-950">{props.title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-500">{props.description}</p>
        </div>
        {props.actionLabel && props.onAction ? (
          <ActionButton onClick={props.onAction}>{props.actionLabel}</ActionButton>
        ) : null}
      </div>
      <div className="mt-5">{props.children}</div>
    </section>
  );
}
