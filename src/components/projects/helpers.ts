import { formatSecondsBreakdown, parseIntervalLabelToSeconds } from "../../lib/time";
import type {
  ActiveExecutionSummary,
  AlarmSummary,
  FlowSummary,
  ProjectSummary,
} from "../../types/app";

export function getPrerequisiteStatusClassName(
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

export function getReadableIntervalLabel(intervalLabel: string) {
  const seconds = parseIntervalLabelToSeconds(intervalLabel);

  if (!seconds) {
    return intervalLabel;
  }

  return formatSecondsBreakdown(seconds);
}

export function deriveProjectStats(
  selectedProject: ProjectSummary | null,
  flows: FlowSummary[],
  activeExecutions: ActiveExecutionSummary[],
) {
  if (!selectedProject) {
    return null;
  }

  return {
    totalFlows: flows.filter((flow) => flow.projectId === selectedProject.id).length,
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
    executingFlows: activeExecutions.filter(
      (execution) => execution.projectId === selectedProject.id,
    ).length,
    nextDue:
      flows
        .filter((flow) => flow.projectId === selectedProject.id && flow.enabled)
        .sort((left, right) => left.nextRunAt.localeCompare(right.nextRunAt))[0]
        ?.nextRunAt ?? "No schedule",
  };
}

export function getRecentProjectAlarms(
  alarms: AlarmSummary[],
  projectId?: string,
) {
  return alarms.filter((alarm) => alarm.projectId === projectId);
}
