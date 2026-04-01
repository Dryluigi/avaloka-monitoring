import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ActionButton } from "../components/ui/buttons";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

export function ConfirmDialogProvider(props: { children: ReactNode }) {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [dialog, setDialog] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    tone: "default",
  });

  const value = useMemo<ConfirmDialogContextValue>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          resolverRef.current = resolve;
          setDialog({
            open: true,
            title: options.title,
            message: options.message,
            confirmLabel: options.confirmLabel ?? "Confirm",
            cancelLabel: options.cancelLabel ?? "Cancel",
            tone: options.tone ?? "default",
          });
        }),
    }),
    [],
  );

  function closeWith(result: boolean) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog((current) => ({ ...current, open: false }));
  }

  return (
    <ConfirmDialogContext.Provider value={value}>
      {props.children}

      {dialog.open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close confirmation"
            className="absolute inset-0"
            onClick={() => closeWith(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  dialog.tone === "danger"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                <ConfirmIcon />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                  {dialog.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {dialog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <ActionButton onClick={() => closeWith(false)}>
                {dialog.cancelLabel}
              </ActionButton>
              <ActionButton
                variant={dialog.tone === "danger" ? "danger" : "primary"}
                onClick={() => closeWith(true)}
              >
                {dialog.confirmLabel}
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const value = useContext(ConfirmDialogContext);

  if (!value) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }

  return value;
}

function ConfirmIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10 4.2 16 15H4z" strokeLinejoin="round" />
      <path d="M10 7.5v3.8M10 13.6h.01" strokeLinecap="round" />
    </svg>
  );
}
