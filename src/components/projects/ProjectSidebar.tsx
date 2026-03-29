import type { ProjectSummary } from "../../types/app";

export function ProjectSidebar(props: {
  projects: ProjectSummary[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
}) {
  const { projects, selectedProjectId, onSelectProject } = props;

  return (
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
              onClick={() => onSelectProject(project.id)}
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
  );
}
