import { useEffect, useMemo, useState } from "react";

import { STATUS_META } from "../../lib/config";
import { formatScheduleTimestamp } from "../../lib/time";
import type {
  DrawerState,
  FlowRunSummary,
  FlowStateEntry,
  FlowSummary,
  PrerequisiteSummary,
  ProjectSummary,
} from "../../types/app";
import { CardSection } from "../ui/layout";
import { MetricPanel } from "../ui/metrics";
import { SmallEmptyState, StatusPill } from "../ui/status";
import { getPrerequisiteStatusClassName } from "./helpers";

export function FlowInspectorPanels(props: {
  selectedFlow: FlowSummary | null;
  selectedProject: ProjectSummary | null;
  selectedFlowPrerequisites: PrerequisiteSummary[];
  selectedFlowState: FlowStateEntry[];
  selectedFlowRuns: FlowRunSummary[];
  onOpenDrawer: (drawer: DrawerState) => void;
}) {
  const {
    onOpenDrawer,
    selectedFlow,
    selectedFlowPrerequisites,
    selectedFlowRuns,
    selectedFlowState,
    selectedProject,
  } = props;
  const runsPageSize = 5;
  const [runsPage, setRunsPage] = useState(1);

  useEffect(() => {
    setRunsPage(1);
  }, [selectedFlow?.id]);

  const totalRunPages = Math.max(1, Math.ceil(selectedFlowRuns.length / runsPageSize));
  const currentRunPage = Math.min(runsPage, totalRunPages);
  const paginatedRuns = useMemo(
    () =>
      selectedFlowRuns.slice(
        (currentRunPage - 1) * runsPageSize,
        currentRunPage * runsPageSize,
      ),
    [currentRunPage, selectedFlowRuns],
  );

  return (
    <div className="space-y-6">
      <CardSection
        title={selectedFlow ? selectedFlow.name : "Flow detail"}
        description={
          selectedFlow
            ? "Runtime configuration, scheduling, and persisted state for the selected flow."
            : "Choose a flow to preview details."
        }
        actionLabel={selectedFlow ? "Edit flow" : undefined}
        onAction={
          selectedFlow && selectedProject
            ? () =>
                onOpenDrawer({
                  type: "flow",
                  mode: "edit",
                  projectId: selectedProject.id,
                  flowId: selectedFlow.id,
                })
            : undefined
        }
      >
        {!selectedFlow ? (
          <SmallEmptyState label="No flow selected for this project." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricPanel label="Executable" value={selectedFlow.executablePath} />
              <MetricPanel label="Working directory" value={selectedFlow.workingDirectory} />
              <MetricPanel label="Arguments" value={selectedFlow.args.join(" ") || "None"} />
              <MetricPanel label="Timeout" value={`${selectedFlow.timeoutSeconds}s`} />
              <MetricPanel
                label="Last run"
                value={formatScheduleTimestamp(selectedFlow.lastRunAt)}
              />
              <MetricPanel
                label="Next run"
                value={formatScheduleTimestamp(selectedFlow.nextRunAt)}
              />
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">Runtime status</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Current scheduling and persisted-state summary for the selected flow.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={selectedFlow.status}>
                    {STATUS_META[selectedFlow.status].label}
                  </StatusPill>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {selectedFlow.stateCount} state entries
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardSection>

      <CardSection
        title="Prerequisites"
        description="Ordered checks and setup steps before the main flow command runs."
        actionLabel={selectedFlow ? "Add prerequisite" : undefined}
        onAction={
          selectedFlow
            ? () =>
                onOpenDrawer({
                  type: "prerequisite",
                  mode: "create",
                  flowId: selectedFlow.id,
                })
            : undefined
        }
      >
        {!selectedFlow ? (
          <SmallEmptyState label="Select a flow to preview its prerequisites." />
        ) : selectedFlowPrerequisites.length === 0 ? (
          <SmallEmptyState label="No prerequisites configured for this flow." />
        ) : (
          <div className="space-y-3">
            {selectedFlowPrerequisites.map((prerequisite) => (
              <button
                key={prerequisite.id}
                type="button"
                onClick={() =>
                  onOpenDrawer({
                    type: "prerequisite",
                    mode: "edit",
                    flowId: selectedFlow.id,
                    prerequisiteId: prerequisite.id,
                  })
                }
                className="w-full rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-left transition hover:border-[var(--border-strong)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {prerequisite.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {prerequisite.executablePath} {prerequisite.args.join(" ")}
                    </div>
                  </div>
                  <span
                    className={[
                      "rounded-full border px-2 py-1 text-[11px] font-medium",
                      getPrerequisiteStatusClassName(
                        prerequisite.status,
                        prerequisite.enabled,
                      ),
                    ].join(" ")}
                  >
                    {prerequisite.enabled ? prerequisite.status : "disabled"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardSection>

      <CardSection
        title="Flow state"
        description="Persisted values that will be reused in future executions of this same flow."
      >
        {!selectedFlow ? (
          <SmallEmptyState label="Select a flow to inspect persisted state." />
        ) : selectedFlowState.length === 0 ? (
          <SmallEmptyState label="No persisted state for this flow yet." />
        ) : (
          <div className="space-y-3">
            {selectedFlowState.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{entry.key}</div>
                  <div className="mt-1 text-xs text-slate-500">{entry.updatedAt}</div>
                </div>
                <code className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  {entry.value}
                </code>
              </div>
            ))}
          </div>
        )}
      </CardSection>

      <CardSection title="Recent runs" description="Latest execution records for the selected flow.">
        {!selectedFlow ? (
          <SmallEmptyState label="Select a flow to see its run history." />
        ) : selectedFlowRuns.length === 0 ? (
          <SmallEmptyState label="This flow does not have any run history yet." />
        ) : (
          <div className="space-y-3">
            {paginatedRuns.map((run) => (
              <div
                key={run.id}
                className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusPill status={run.status}>
                      {STATUS_META[run.status].label}
                    </StatusPill>
                    <span className="text-sm font-medium text-slate-900">
                      {run.startedAt}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{run.durationLabel}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{run.summary}</p>
                {run.failureMessage ? (
                  <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    {run.failureMessage}
                  </div>
                ) : null}
              </div>
            ))}

            <div className="flex flex-col gap-3 border-t border-[var(--border-soft)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Page {currentRunPage} of {totalRunPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRunsPage((value) => Math.max(1, value - 1))}
                  disabled={currentRunPage === 1}
                  className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--accent-border)] hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRunsPage((value) => Math.min(totalRunPages, value + 1))
                  }
                  disabled={currentRunPage === totalRunPages}
                  className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </CardSection>
    </div>
  );
}
