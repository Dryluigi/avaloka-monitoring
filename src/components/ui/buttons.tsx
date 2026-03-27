import type { ReactNode } from "react";

export function ActionButton(props: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const variant = props.variant ?? "secondary";

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "rounded-xl border px-4 py-2 text-sm font-medium transition",
        variant === "primary"
          ? "border-[var(--accent-border)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]"
          : "border-[var(--border-strong)] bg-white text-slate-700 hover:border-[var(--accent-border)] hover:text-slate-950",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

export function DrawerActions(props: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-[var(--border-soft)] pt-5">
      <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
      <ActionButton variant="primary" onClick={props.onSave}>
        {props.saveLabel}
      </ActionButton>
    </div>
  );
}
