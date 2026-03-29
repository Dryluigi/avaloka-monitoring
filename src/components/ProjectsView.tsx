import { useEffect, useMemo } from "react";

import { STATUS_META } from "../lib/config";
import {
  formatScheduleTimestamp,
  formatSecondsBreakdown,
  parseIntervalLabelToSeconds,
} from "../lib/time";
import { useAppState } from "../state/AppStateContext";
import type { FlowFilter } from "../types/app";
import { ActionButton } from "./ui/buttons";
import { CardSection } from "./ui/layout";
import { Metric, MetricPanel, StatCard } from "./ui/metrics";
import { EmptyState, SmallEmptyState, StatusPill } from "./ui/status";

function getPrerequisiteStatusClassName(
  status: "ready" | "success" | "failed",
  enabled: boolean,
) {
  if (!enabled) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function getReadableIntervalLabel(intervalLabel: string) {
  const seconds = parseIntervalLabelToSeconds(intervalLabel);

  if (!seconds) {
    return intervalLabel;
  }

  return formatSecondsBreakdown(seconds);
}

export function ProjectsView() {
  const {
    alarms,
    flowStateEntries,
    projects,
    variables,
    flows,
    prerequisites,
    runs,
    selectedProjectId,
    selectedFlowId,
    flowFilter,
    setSelectedProjectId,
    setSelectedFlowId,
    setFlowFilter,
    setDrawer,
  } = useAppState();

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ??
    projects[0] ??
    null;

  const visibleFlows = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    const projectFlows = flows.filter(
      (flow) => flow.projectId === selectedProject.id,
    );

    if (flowFilter === "active") {
      return projectFlows.filter((flow) => flow.enabled);
    }

    if (flowFilter === "failing") {
      return projectFlows.filter(
        (flow) =>
          flow.status === "failed" ||
          flow.status === "prerequisite_failed" ||
          flow.status === "timed_out",
      );
    }

    return projectFlows;
  }, [flowFilter, flows, selectedProject]);

  useEffect(() => {
    if (!projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id ?? "");
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    if (!visibleFlows.some((flow) => flow.id === selectedFlowId)) {
      setSelectedFlowId(visibleFlows[0]?.id ?? "");
    }
  }, [selectedFlowId, setSelectedFlowId, visibleFlows]);

  const selectedFlow =
    flows.find(
      (flow) =>
        flow.id === selectedFlowId && flow.projectId === selectedProject?.id,
    ) ??
    visibleFlows[0] ??
    null;

  const selectedProjectVariables = variables.filter(
    (variable) => variable.projectId === selectedProject?.id,
  );
  const selectedFlowPrerequisites = prerequisites.filter(
    (prerequisite) => prerequisite.flowId === selectedFlow?.id,
  );
  const selectedFlowRuns = runs.filter(
    (run) => run.flowId === selectedFlow?.id,
  );
  const selectedProjectAlarms = alarms.filter(
    (alarm) => alarm.projectId === selectedProject?.id,
  );
  const selectedFlowState = flowStateEntries.filter(
    (entry) => entry.flowId === selectedFlow?.id,
  );

  const projectStats = selectedProject
    ? {
        totalFlows: flows.filter(
          (flow) => flow.projectId === selectedProject.id,
        ).length,
        activeFlows: flows.filter(
          (flow) => flow.projectId === selectedProject.id && flow.enabled,
        ).length,
        failingFlows: flows.filter(
          (flow) =>
            flow.projectId === selectedProject.id &&
            (flow.status === "failed" ||
              flow.status === "prerequisite_failed" ||
              flow.status === "timed_out"),
        ).length,
        nextDue:
          flows
            .filter(
              (flow) => flow.projectId === selectedProject.id && flow.enabled,
            )
            .sort((left, right) =>
              left.nextRunAt.localeCompare(right.nextRunAt),
            )[0]?.nextRunAt ?? "No schedule",
      }
    : null;

  return (
    <div className="grid gap-6 xl:h-[calc(100vh-9rem)] xl:grid-cols-[300px_minmax(0,1fr)] xl:overflow-hidden">
      <section className="flex rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-4 xl:h-full xl:flex-col xl:overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Projects</h3>
            <p className="mt-1 text-sm text-slate-500">
              Persisted project list with mock flow detail still layered on top.
            </p>
          </div>
          <span className="rounded-full border border-[var(--border-soft)] bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
            {projects.length}
          </span>
        </div>

        <div className="mt-4 space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
          {projects.map((project) => {
            const active = project.id === selectedProjectId;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className={[
                  "w-full rounded-2xl border p-4 text-left transition",
                  active
                    ? "border-[var(--accent-border)] bg-[var(--accent-soft)] shadow-[var(--shadow-soft)]"
                    : "border-[var(--border-soft)] bg-white hover:border-[var(--border-strong)] hover:bg-slate-50/80",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {project.name}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {project.description}
                    </div>
                  </div>
                  <span
                    className={[
                      "rounded-full border px-2 py-1 text-[11px] font-medium",
                      project.enabled
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {project.enabled ? "Enabled" : "Draft"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    {project.flowCount} flows
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    {project.variableCount + project.secretCount} variables
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-6 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {selectedProject?.name ?? "No project selected"}
                </h3>
                {selectedProject ? (
                  <StatusPill
                    status={selectedProject.enabled ? "success" : "disabled"}
                  >
                    {selectedProject.enabled
                      ? "Active project"
                      : "Disabled project"}
                  </StatusPill>
                ) : null}
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {selectedProject?.description ??
                  "Pick a project to preview its flows, variables, and runtime state."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                onClick={() =>
                  selectedProject &&
                  setDrawer({
                    type: "project",
                    mode: "edit",
                    projectId: selectedProject.id,
                  })
                }
              >
                Edit project
              </ActionButton>
              {selectedFlow && selectedProject ? (
                <ActionButton
                  onClick={() =>
                    setDrawer({
                      type: "flow",
                      mode: "edit",
                      projectId: selectedProject.id,
                      flowId: selectedFlow.id,
                    })
                  }
                >
                  Edit flow
                </ActionButton>
              ) : null}
              <ActionButton
                variant="primary"
                onClick={() =>
                  selectedProject &&
                  setDrawer({
                    type: "flow",
                    mode: "create",
                    projectId: selectedProject.id,
                  })
                }
              >
                New flow
              </ActionButton>
            </div>
          </div>

          {projectStats ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total flows"
                value={String(projectStats.totalFlows)}
              />
              <StatCard
                label="Active flows"
                value={String(projectStats.activeFlows)}
              />
              <StatCard
                label="Failing flows"
                value={String(projectStats.failingFlows)}
              />
              <StatCard label="Next due" value={projectStats.nextDue} />
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-950">
                    Flows
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Independent schedules with last run, next run, and current
                    health.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border-soft)] bg-slate-50 p-1">
                  {(["all", "active", "failing"] as FlowFilter[]).map(
                    (filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setFlowFilter(filter)}
                        className={[
                          "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                          flowFilter === filter
                            ? "bg-white text-slate-950 shadow-[var(--shadow-soft)]"
                            : "text-slate-500 hover:text-slate-900",
                        ].join(" ")}
                      >
                        {filter === "all"
                          ? "All"
                          : filter === "active"
                            ? "Active"
                            : "Failing"}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {selectedProject &&
              flows.filter((flow) => flow.projectId === selectedProject.id)
                .length === 0 ? (
                <EmptyState
                  title="No flows yet"
                  body="This project is ready for its first monitoring flow. Create one to validate the prototype editor."
                  actionLabel="Create first flow"
                  onAction={() =>
                    selectedProject &&
                    setDrawer({
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
                  onAction={() => setFlowFilter("all")}
                />
              ) : (
                <div className="mt-5 space-y-3">
                  {visibleFlows.map((flow) => (
                    <button
                      key={flow.id}
                      type="button"
                      onClick={() => setSelectedFlowId(flow.id)}
                      className={[
                        "w-full rounded-2xl border p-4 text-left transition",
                        flow.id === selectedFlowId
                          ? "border-[var(--accent-border)] bg-[var(--accent-soft)] shadow-[var(--shadow-soft)]"
                          : "border-[var(--border-soft)] bg-white hover:border-[var(--border-strong)]",
                      ].join(" ")}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {flow.name}
                            </span>
                            <StatusPill status={flow.status}>
                              {STATUS_META[flow.status].label}
                            </StatusPill>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {flow.executablePath} {flow.args.join(" ")}
                          </div>
                        </div>
                        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
                          <Metric
                            label="Interval"
                            value={getReadableIntervalLabel(flow.intervalLabel)}
                            valueClassName="text-xs leading-5 text-slate-700"
                          />
                          <Metric
                            label="Last run"
                            value={formatScheduleTimestamp(flow.lastRunAt)}
                          />
                          <Metric
                            label="Next run"
                            value={formatScheduleTimestamp(flow.nextRunAt)}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <CardSection
                title="Project variables"
                description="Shared values and masked secrets available to every flow in this project."
                actionLabel="Add variable"
                onAction={() =>
                  selectedProject &&
                  setDrawer({
                    type: "variable",
                    mode: "create",
                    projectId: selectedProject.id,
                  })
                }
              >
                {selectedProjectVariables.length === 0 ? (
                  <SmallEmptyState label="No variables configured yet." />
                ) : (
                  <div className="space-y-3">
                    {selectedProjectVariables.map((variable) => (
                      <button
                        key={variable.id}
                        type="button"
                        onClick={() =>
                          selectedProject &&
                          setDrawer({
                            type: "variable",
                            mode: "edit",
                            projectId: selectedProject.id,
                            variableId: variable.id,
                          })
                        }
                        className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-left transition hover:border-[var(--border-strong)]"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {variable.key}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {variable.isSecret
                              ? "Secret value"
                              : variable.value}
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                          {variable.isSecret ? "Masked" : "Plain"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardSection>

              <CardSection
                title="Recent alarms"
                description="Latest project alerts for a quick health snapshot."
              >
                {selectedProjectAlarms.length === 0 ? (
                  <SmallEmptyState label="No alarms for this project." />
                ) : (
                  <div className="space-y-3">
                    {selectedProjectAlarms.slice(0, 3).map((alarm) => (
                      <div
                        key={alarm.id}
                        className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={[
                              "rounded-full px-2 py-1 text-[11px] font-medium",
                              alarm.severity === "critical"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {alarm.severity}
                          </span>
                          <span className="text-xs text-slate-400">
                            {alarm.createdAt}
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-medium text-slate-900">
                          {alarm.flowName}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {alarm.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardSection>
            </section>
          </div>

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
                      setDrawer({
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
                    <MetricPanel
                      label="Executable"
                      value={selectedFlow.executablePath}
                    />
                    <MetricPanel
                      label="Working directory"
                      value={selectedFlow.workingDirectory}
                    />
                    <MetricPanel
                      label="Arguments"
                      value={selectedFlow.args.join(" ") || "None"}
                    />
                    <MetricPanel
                      label="Timeout"
                      value={`${selectedFlow.timeoutSeconds}s`}
                    />
                    <MetricPanel
                      label="Last run"
                      value={formatScheduleTimestamp(selectedFlow.lastRunAt)}
                    />
                    <MetricPanel
                      label="Next run"
                      value={formatScheduleTimestamp(selectedFlow.nextRunAt)}
                    />
                  </div>

                  <div className="rounded-2xl border border-[var(--border-soft)] bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    Stored state entries:{" "}
                    <span className="font-medium text-slate-900">
                      {selectedFlow.stateCount}
                    </span>
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
                      setDrawer({
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
                        selectedFlow &&
                        setDrawer({
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
                            {prerequisite.executablePath}{" "}
                            {prerequisite.args.join(" ")}
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
                          {prerequisite.enabled
                            ? prerequisite.status
                            : "disabled"}
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
                        <div className="text-sm font-medium text-slate-900">
                          {entry.key}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {entry.updatedAt}
                        </div>
                      </div>
                      <code className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                        {entry.value}
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </CardSection>

            <CardSection
              title="Recent runs"
              description="Latest execution records for the selected flow."
            >
              {!selectedFlow ? (
                <SmallEmptyState label="Select a flow to see its run history." />
              ) : selectedFlowRuns.length === 0 ? (
                <SmallEmptyState label="This flow does not have any run history yet." />
              ) : (
                <div className="space-y-3">
                  {selectedFlowRuns.map((run) => (
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
                        <span className="text-xs text-slate-500">
                          {run.durationLabel}
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
                  ))}
                </div>
              )}
            </CardSection>
          </div>
        </div>
      </section>
    </div>
  );
}
