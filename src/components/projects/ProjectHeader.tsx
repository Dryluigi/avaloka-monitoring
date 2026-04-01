import { formatScheduleTimestamp } from "../../lib/time";
import type { DrawerState, ProjectSummary } from "../../types/app";
import { ActionButton } from "../ui/buttons";
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
          <ProjectHeaderStat
            icon={<FlowStackIcon />}
            label="Total flows"
            value={String(projectStats.totalFlows)}
          />
          <ProjectHeaderStat
            icon={<PulseIcon />}
            label="Active"
            value={String(projectStats.activeFlows)}
          />
          <ProjectHeaderStat
            icon={<AlertIcon />}
            label="Failing"
            value={String(projectStats.failingFlows)}
          />
          <ProjectHeaderStat
            icon={<ExecutingIcon />}
            label="Executing"
            value={String(projectStats.executingFlows)}
            tone="teal"
          />
          <ProjectHeaderStat
            icon={<CalendarSmallIcon />}
            label="Next run"
            value={formatScheduleTimestamp(projectStats.nextDue)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ProjectHeaderStat(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "teal";
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        props.tone === "teal"
          ? "border-teal-200 bg-teal-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          props.tone === "teal"
            ? "bg-teal-100 text-teal-700"
            : "bg-slate-100 text-slate-500",
        ].join(" ")}
      >
        {props.icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
          {props.label}
        </div>
        <div className="mt-1 text-sm font-medium leading-5 text-slate-800 break-words">
          {props.value}
        </div>
      </div>
    </div>
  );
}

function ProjectIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M3.5 5.5h5l1.4 1.7H16.5v7.3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowStackIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="4" y="4" width="12" height="3.5" rx="1.2" />
      <rect x="4" y="8.2" width="12" height="3.5" rx="1.2" />
      <rect x="4" y="12.4" width="12" height="3.5" rx="1.2" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M3.5 10h3l1.7-3.2 3.2 6 1.6-2.8h3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10 4.2 16 15H4z" strokeLinejoin="round" />
      <path d="M10 7.5v3.8M10 13.6h.01" strokeLinecap="round" />
    </svg>
  );
}

function ExecutingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="10" cy="10" r="5.8" />
      <path
        d="M10 6.8v3.4l2.3 1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarSmallIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3.5" y="5" width="13" height="11" rx="2" />
      <path d="M6.5 3.8v2.4M13.5 3.8v2.4M3.5 8.2h13" strokeLinecap="round" />
    </svg>
  );
}
