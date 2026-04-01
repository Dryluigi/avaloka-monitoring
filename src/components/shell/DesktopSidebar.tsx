import type { AppSection } from "../../types/app";
import { NavigationMenu } from "./NavigationMenu";

export function DesktopSidebar(props: {
  section: AppSection;
  onSelectSection: (section: AppSection) => void;
}) {
  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-slate-900/60 bg-slate-950 px-5 py-6 text-slate-100 lg:flex">
      <div className="mb-8">
        <div className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100">
          Advanced Monitor
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
          Monitoring prototype
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Frontend-only shell with dashboard, mock scheduling, flow state, and
          alarm visibility.
        </p>
      </div>

      <NavigationMenu
        section={props.section}
        onSelectSection={props.onSelectSection}
      />

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
          Prototype notes
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Uses local mock data only. Drawers and lists are interactive to
          validate layout and workflow.
        </p>
      </div>
    </aside>
  );
}
