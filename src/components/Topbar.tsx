import { useEffect, useState } from "react";

import { formatFullTimestamp } from "../lib/time";

export function Topbar(props: {
  sectionTitle: string;
  onOpenMobileNav: () => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--border-soft)] bg-[var(--panel)]/95 px-5 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={props.onOpenMobileNav}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-white text-slate-700 transition hover:border-[var(--accent-border)] hover:text-slate-950 lg:hidden"
            aria-label="Open navigation"
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>

          <div>
            <p className="text-sm font-medium text-[var(--accent)]">
              Frontend-only prototype
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              {props.sectionTitle}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-2 text-sm text-slate-500">
            {formatFullTimestamp(now)}
          </div>
        </div>
      </div>
    </div>
  );
}
