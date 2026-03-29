import { formatScheduleTimestamp } from "../../lib/time";
import type { DrawerState, ProjectSummary } from "../../types/app";
import { ActionButton } from "../ui/buttons";
import { StatCard } from "../ui/metrics";
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
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              {selectedProject?.name ?? "No project selected"}
            </h3>
            {selectedProject ? (
              <StatusPill status={selectedProject.enabled ? "success" : "disabled"}>
                {selectedProject.enabled ? "Active project" : "Disabled project"}
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
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total flows" value={String(projectStats.totalFlows)} />
          <StatCard label="Active flows" value={String(projectStats.activeFlows)} />
          <StatCard label="Failing flows" value={String(projectStats.failingFlows)} />
          <StatCard
            label="Executing now"
            value={String(projectStats.executingFlows)}
            tone="teal"
          />
          <StatCard label="Next due" value={formatScheduleTimestamp(projectStats.nextDue)} />
        </div>
      ) : null}
    </div>
  );
}
