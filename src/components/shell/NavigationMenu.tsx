import { NAV_ITEMS } from "../../lib/config";
import type { AppSection } from "../../types/app";

export function NavigationMenu(props: {
  section: AppSection;
  onSelectSection: (section: AppSection) => void;
}) {
  return (
    <nav className="space-y-2">
      {NAV_ITEMS.map((item) => {
        const active = item.id === props.section;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => props.onSelectSection(item.id)}
            className={[
              "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
              active
                ? "border-sky-300/30 bg-white/10 text-white"
                : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white",
            ].join(" ")}
          >
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="mt-1 text-xs text-slate-300/80">
              {item.description}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
