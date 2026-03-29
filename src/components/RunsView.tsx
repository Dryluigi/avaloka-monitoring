import { useEffect, useMemo, useState } from "react";

import { STATUS_META } from "../lib/config";
import { formatUserFacingRunSummary } from "../lib/run-output";
import { useAppState } from "../state/AppStateContext";
import { StatCard } from "./ui/metrics";
import { StatusPill } from "./ui/status";

export function RunsView() {
  const { flows, projects, runs } = useAppState();
  const pageSize = 6;
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState("all");

  const flowOptions = useMemo(() => {
    if (projectFilter === "all") {
      return flows;
    }

    return flows.filter((flow) => flow.projectId === projectFilter);
  }, [flows, projectFilter]);

  const filteredRuns = useMemo(
    () =>
      runs.filter((run) => {
        if (projectFilter !== "all" && run.projectId !== projectFilter) {
          return false;
        }

        if (flowFilter !== "all" && run.flowId !== flowFilter) {
          return false;
        }

        return true;
      }),
    [flowFilter, projectFilter, runs],
  );

  useEffect(() => {
    if (
      flowFilter !== "all" &&
      !flowOptions.some((flow) => flow.id === flowFilter)
    ) {
      setFlowFilter("all");
    }
  }, [flowFilter, flowOptions]);

  useEffect(() => {
    setPage(1);
  }, [flowFilter, projectFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRuns = filteredRuns.slice(
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
            <StatCard label="Recent runs" value={String(filteredRuns.length)} />
            <StatCard
              label="Failures"
              value={String(
                filteredRuns.filter((run) => run.status !== "success").length,
              )}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Project filter</span>
            <div className="relative">
              <select
                value={projectFilter}
                onChange={(event) => {
                  setProjectFilter(event.target.value);
                }}
                className="w-full appearance-none rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-[var(--accent-border)] focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Flow filter</span>
            <div className="relative">
              <select
                value={flowFilter}
                disabled={projectFilter === "all"}
                onChange={(event) => {
                  setFlowFilter(event.target.value);
                }}
                className="w-full appearance-none rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-[var(--accent-border)] focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="all">All flows</option>
                {flowOptions.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            {projectFilter === "all" ? (
              <p className="text-xs text-slate-500">
                Select a project first to filter by flow.
              </p>
            ) : null}
          </label>
        </div>

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
                  {formatUserFacingRunSummary(run.summary)}
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
