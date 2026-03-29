import { useState } from "react";

import { STATUS_META } from "../lib/config";
import { useAppState } from "../state/AppStateContext";
import { StatCard } from "./ui/metrics";
import { StatusPill } from "./ui/status";

export function RunsView() {
  const { projects, runs } = useAppState();
  const pageSize = 6;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(runs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRuns = runs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Execution timeline
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Cross-project preview of recent flow runs, intended to validate
              the monitoring activity view.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Projects" value={String(projects.length)} />
            <StatCard label="Recent runs" value={String(runs.length)} />
            <StatCard
              label="Failures"
              value={String(
                runs.filter((run) => run.status !== "success").length,
              )}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        <div className="space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
          {paginatedRuns.map((run) => (
            <div
              key={run.id}
              className="grid gap-4 rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-4 md:grid-cols-[170px_minmax(0,1fr)_120px]"
            >
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {run.projectName}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  {run.flowName}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={run.status}>
                    {STATUS_META[run.status].label}
                  </StatusPill>
                  <span className="text-xs text-slate-500">
                    {run.startedAt}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {run.summary}
                </p>
                {run.failureMessage ? (
                  <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    {run.failureMessage}
                  </div>
                ) : null}
              </div>
              <div className="text-sm text-slate-500 md:text-right">
                <div>{run.durationLabel}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {run.finishedAt}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-soft)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--accent-border)] hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
