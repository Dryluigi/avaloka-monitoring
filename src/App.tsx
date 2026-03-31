import { useEffect, useMemo, useState } from "react";

import { AlarmsView } from "./components/AlarmsView";
import { DashboardView } from "./components/DashboardView";
import { Drawer } from "./components/Drawer";
import { ProjectsView } from "./components/ProjectsView";
import { RunsView } from "./components/RunsView";
import { Topbar } from "./components/Topbar";
import { NAV_ITEMS } from "./lib/config";
import { AppStateProvider, useAppState } from "./state/AppStateContext";
import type { AppSection } from "./types/app";

function AppShell() {
  const [section, setSection] = useState<AppSection>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { projects, selectedProjectId } = useAppState();

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ??
    projects[0] ??
    null;

  const sectionTitle = useMemo(() => {
    if (section === "dashboard") {
      return "Operational dashboard";
    }

    if (section === "projects") {
      return selectedProject?.name ?? "Projects";
    }

    if (section === "runs") {
      return "Recent runs";
    }

    return "Alarm center";
  }, [section, selectedProject?.name]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [section]);

  return (
    <div className="h-screen overflow-hidden bg-[var(--app-bg)] text-slate-900 antialiased">
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-slate-900/60 bg-slate-950 px-5 py-6 text-slate-100 lg:flex">
          <div className="mb-8">
            <div className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100">
              Advanced Monitor
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              Monitoring prototype
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Frontend-only shell with dashboard, mock scheduling, flow state,
              and alarm visibility.
            </p>
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = item.id === section;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
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

        <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            sectionTitle={sectionTitle}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <div className="min-h-0 flex-1 overflow-hidden p-5 md:p-8">
            <div className="h-full min-h-0 overflow-y-auto xl:overflow-hidden">
              {section === "dashboard" ? (
                <DashboardView onNavigate={setSection} />
              ) : section === "projects" ? (
                <ProjectsView />
              ) : section === "runs" ? (
                <RunsView />
              ) : (
                <AlarmsView />
              )}
            </div>
          </div>
        </main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setMobileNavOpen(false)}
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
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-200"
                aria-label="Close navigation"
              >
                ×
              </button>
            </div>

            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const active = item.id === section;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
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
          </aside>
        </div>
      ) : null}

      <Drawer />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}
