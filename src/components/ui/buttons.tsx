import type { ReactNode } from "react";

export function ActionButton(props: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  const variant = props.variant ?? "secondary";

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition",
        variant === "primary"
          ? "border-[var(--accent-border)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]"
          : variant === "danger"
            ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100"
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
  onDestructive?: () => void;
  destructiveLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-5">
      <div>
        {props.onDestructive && props.destructiveLabel ? (
          <ActionButton variant="danger" onClick={props.onDestructive}>
            {props.destructiveLabel}
          </ActionButton>
        ) : null}
      </div>

      <ActionButton onClick={props.onCancel}>Cancel</ActionButton>
      <ActionButton variant="primary" onClick={props.onSave}>
        {props.saveLabel}
      </ActionButton>
    </div>
  );
}
