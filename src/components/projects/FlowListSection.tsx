import type { ReactNode } from "react";

import { CalendarIcon } from "../icons/CalendarIcon";
import { HistoryIcon } from "../icons/HistoryIcon";
import { IntervalIcon } from "../icons/IntervalIcon";
import { STATUS_META } from "../../lib/config";
import { formatScheduleTimestamp } from "../../lib/time";
import type { DrawerState, FlowFilter, FlowSummary, ProjectSummary } from "../../types/app";
import { EmptyState, StatusPill } from "../ui/status";
import { getReadableIntervalLabel } from "./helpers";

export function FlowListSection(props: {
  selectedProject: ProjectSummary | null;
  flows: FlowSummary[];
  visibleFlows: FlowSummary[];
  selectedFlowId: string;
  flowFilter: FlowFilter;
  activeExecutionFlowIds: Set<string>;
  onSelectFlow: (flowId: string) => void;
  onSetFilter: (filter: FlowFilter) => void;
  onOpenDrawer: (drawer: DrawerState) => void;
}) {
  const {
    activeExecutionFlowIds,
    flowFilter,
    flows,
    onOpenDrawer,
    onSelectFlow,
    onSetFilter,
    selectedFlowId,
    selectedProject,
    visibleFlows,
  } = props;

  return (
    <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-950">Flows</h4>
          <p className="mt-1 text-sm text-slate-500">
            Independent schedules with last run, next run, and current health.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border-soft)] bg-slate-50 p-1">
          {(["all", "active", "failing"] as FlowFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onSetFilter(filter)}
              className={[
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                flowFilter === filter
                  ? "bg-white text-slate-950 shadow-[var(--shadow-soft)]"
                  : "text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              {filter === "all" ? "All" : filter === "active" ? "Active" : "Failing"}
            </button>
          ))}
        </div>
      </div>

      {selectedProject &&
      flows.filter((flow) => flow.projectId === selectedProject.id).length === 0 ? (
        <EmptyState
          title="No flows yet"
          body="This project is ready for its first monitoring flow. Create one to validate the prototype editor."
          actionLabel="Create first flow"
          onAction={() =>
            onOpenDrawer({
              type: "flow",
              mode: "create",
              projectId: selectedProject.id,
            })
          }
        />
      ) : visibleFlows.length === 0 ? (
        <EmptyState
          title="No flows in this filter"
          body="Try switching back to All or create a new flow to populate this view."
          actionLabel="Show all flows"
          onAction={() => onSetFilter("all")}
        />
      ) : (
        <div className="mt-5 space-y-3">
          {visibleFlows.map((flow) => {
            const isExecuting = activeExecutionFlowIds.has(flow.id);

            return (
              <button
                key={flow.id}
                type="button"
                onClick={() => onSelectFlow(flow.id)}
                className={[
                  "w-full rounded-2xl border p-4 text-left transition",
                  isExecuting && flow.id === selectedFlowId
                    ? "border-teal-300 bg-teal-50"
                    : isExecuting
                      ? "border-teal-200 bg-teal-50/70"
                      : flow.id === selectedFlowId
                        ? "border-[var(--accent-border)] bg-[var(--accent-soft)] shadow-[var(--shadow-soft)]"
                        : "border-[var(--border-soft)] bg-white hover:border-[var(--border-strong)]",
                ].join(" ")}
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{flow.name}</span>
                      {isExecuting ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
                          Executing
                        </span>
                      ) : null}
                      <StatusPill status={flow.status}>
                        {STATUS_META[flow.status].label}
                      </StatusPill>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {flow.description ?? ""}
                    </div>
                  </div>

                  <div className="grid gap-2.5 border-t border-[var(--border-soft)] pt-3 sm:grid-cols-3">
                    <FlowInfoItem
                      icon={<IntervalIcon />}
                      label="Interval"
                      value={getReadableIntervalLabel(flow.intervalLabel)}
                    />
                    <FlowInfoItem
                      icon={<HistoryIcon />}
                      label="Last run"
                      value={formatScheduleTimestamp(flow.lastRunAt)}
                    />
                    <FlowInfoItem
                      icon={<CalendarIcon />}
                      label="Next run"
                      value={formatScheduleTimestamp(flow.nextRunAt)}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FlowInfoItem(props: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-2">
      <div
        title={props.label}
        aria-label={props.label}
        className="flex shrink-0 items-center justify-center text-slate-500"
      >
        {props.icon}
      </div>
      <div className="min-w-0 text-[13px] font-medium leading-5 text-slate-700 break-words">
        {props.value}
      </div>
    </div>
  );
}
