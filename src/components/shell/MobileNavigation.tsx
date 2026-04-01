import type { AppSection } from "../../types/app";
import { NavigationMenu } from "./NavigationMenu";

export function MobileNavigation(props: {
  open: boolean;
  section: AppSection;
  onClose: () => void;
  onSelectSection: (section: AppSection) => void;
}) {
  if (!props.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-slate-950/45"
        onClick={props.onClose}
      />

      <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-slate-900/70 bg-slate-950 px-5 py-6 text-slate-100">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100">
              Advanced Monitor
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
              Monitoring prototype
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Navigate the prototype sections on smaller screens.
            </p>
          </div>

          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-200"
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <NavigationMenu
          section={props.section}
          onSelectSection={props.onSelectSection}
        />
      </aside>
    </div>
  );
}
