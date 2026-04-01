import { useEffect, useMemo, useState } from "react";

import { AlarmsView } from "./components/AlarmsView";
import { DashboardView } from "./components/DashboardView";
import { Drawer } from "./components/Drawer";
import { ProjectsView } from "./components/ProjectsView";
import { RunsView } from "./components/RunsView";
import { DesktopSidebar } from "./components/shell/DesktopSidebar";
import { MobileNavigation } from "./components/shell/MobileNavigation";
import { Topbar } from "./components/Topbar";
import { SECTION_TITLES } from "./lib/constants";
import { AppStateProvider, useAppState } from "./state/AppStateContext";
import { ConfirmDialogProvider } from "./state/ConfirmDialogContext";
import type { AppSection } from "./types/app";

function AppShell() {
  const [section, setSection] = useState<AppSection>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { projects, selectedProjectId, setDrawer } = useAppState();

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ??
    projects[0] ??
    null;

  const sectionTitle = useMemo(() => {
    if (section === "projects") {
      return selectedProject?.name ?? SECTION_TITLES.projects;
    }

    return SECTION_TITLES[section];
  }, [section, selectedProject?.name]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [section]);

  return (
    <div className="h-screen overflow-hidden bg-[var(--app-bg)] text-slate-900 antialiased">
      <div className="flex h-screen overflow-hidden">
        <DesktopSidebar section={section} onSelectSection={setSection} />

        <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            sectionTitle={sectionTitle}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onNewProject={
              section === "projects"
                ? () => setDrawer({ type: "project", mode: "create" })
                : undefined
            }
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

      <MobileNavigation
        open={mobileNavOpen}
        section={section}
        onClose={() => setMobileNavOpen(false)}
        onSelectSection={setSection}
      />

      <Drawer />
    </div>
  );
}

export default function App() {
  return (
    <ConfirmDialogProvider>
      <AppStateProvider>
        <AppShell />
      </AppStateProvider>
    </ConfirmDialogProvider>
  );
}
