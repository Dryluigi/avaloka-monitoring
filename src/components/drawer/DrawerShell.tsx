import type { ReactNode } from "react";

export function DrawerShell(props: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <div
        className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-[-24px_0_60px_rgba(15,23,42,0.12)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
              App drawer
            </div>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              {props.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Configure persisted monitoring entities and update the local app
              state immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-2xl border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-slate-500 transition hover:border-[var(--border-strong)] hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">{props.children}</div>
      </div>
    </div>
  );
}
