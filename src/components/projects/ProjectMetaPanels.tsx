import type { AlarmSummary, DrawerState, ProjectSummary, ProjectVariable } from "../../types/app";
import { CardSection } from "../ui/layout";
import { SmallEmptyState } from "../ui/status";

export function ProjectMetaPanels(props: {
  selectedProject: ProjectSummary | null;
  selectedProjectVariables: ProjectVariable[];
  selectedProjectAlarms: AlarmSummary[];
  onOpenDrawer: (drawer: DrawerState) => void;
}) {
  const {
    onOpenDrawer,
    selectedProject,
    selectedProjectAlarms,
    selectedProjectVariables,
  } = props;

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <CardSection
        title="Project variables"
        description="Shared values and masked secrets available to every flow in this project."
        actionLabel="Add variable"
        onAction={() =>
          selectedProject &&
          onOpenDrawer({
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
                  onOpenDrawer({
                    type: "variable",
                    mode: "edit",
                    projectId: selectedProject.id,
                    variableId: variable.id,
                  })
                }
                className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-left transition hover:border-[var(--border-strong)]"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{variable.key}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {variable.isSecret ? "Secret value" : variable.value}
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
                  <span className="text-xs text-slate-400">{alarm.createdAt}</span>
                </div>
                <div className="mt-2 text-sm font-medium text-slate-900">{alarm.flowName}</div>
                <p className="mt-1 text-sm leading-6 text-slate-500">{alarm.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardSection>
    </section>
  );
}
