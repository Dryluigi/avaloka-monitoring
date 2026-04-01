import { AlertIcon } from "../icons/AlertIcon";
import { CalendarIcon } from "../icons/CalendarIcon";
import { ExecutingIcon } from "../icons/ExecutingIcon";
import { FlowStackIcon } from "../icons/FlowStackIcon";
import { ProjectIcon } from "../icons/ProjectIcon";
import { PulseIcon } from "../icons/PulseIcon";
import { formatScheduleTimestamp } from "../../lib/time";
import type { DrawerState, ProjectSummary } from "../../types/app";
import { ActionButton } from "../ui/buttons";
import { IconStatCard } from "../ui/metrics";
import { StatusPill } from "../ui/status";

export function ProjectHeader(props: {
  selectedProject: ProjectSummary | null;
  selectedFlowId?: string;
  projectStats: {
    totalFlows: number;
    activeFlows: number;
    failingFlows: number;
    executingFlows: number;
    nextDue: string;
  } | null;
  onOpenDrawer: (drawer: DrawerState) => void;
}) {
  const { onOpenDrawer, projectStats, selectedFlowId, selectedProject } = props;

  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
              <ProjectIcon />
            </span>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">
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
              onOpenDrawer({
                type: "project",
                mode: "edit",
                projectId: selectedProject.id,
              })
            }
          >
            Edit project
          </ActionButton>
          {selectedProject && selectedFlowId ? (
            <ActionButton
              onClick={() =>
                onOpenDrawer({
                  type: "flow",
                  mode: "edit",
                  projectId: selectedProject.id,
                  flowId: selectedFlowId,
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
              onOpenDrawer({
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
        <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
          <IconStatCard
            icon={<FlowStackIcon />}
            label="Total flows"
            value={String(projectStats.totalFlows)}
          />
          <IconStatCard
            icon={<PulseIcon />}
            label="Active"
            value={String(projectStats.activeFlows)}
          />
          <IconStatCard
            icon={<AlertIcon />}
            label="Failing"
            value={String(projectStats.failingFlows)}
          />
          <IconStatCard
            icon={<ExecutingIcon />}
            label="Executing"
            value={String(projectStats.executingFlows)}
            tone="teal"
          />
          <IconStatCard
            icon={<CalendarIcon />}
            label="Next run"
            value={formatScheduleTimestamp(projectStats.nextDue)}
          />
        </div>
      ) : null}
    </div>
  );
}
