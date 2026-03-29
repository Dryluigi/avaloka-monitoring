import { useEffect, useMemo } from "react";

import { useAppState } from "../state/AppStateContext";
import type { DrawerState, FlowFilter } from "../types/app";
import { FlowInspectorPanels } from "./projects/FlowInspectorPanels";
import { FlowListSection } from "./projects/FlowListSection";
import { deriveProjectStats, getRecentProjectAlarms } from "./projects/helpers";
import { ProjectHeader } from "./projects/ProjectHeader";
import { ProjectMetaPanels } from "./projects/ProjectMetaPanels";
import { ProjectSidebar } from "./projects/ProjectSidebar";

export function ProjectsView() {
  const {
    activeExecutions,
    alarms,
    flowStateEntries,
    flows,
    flowFilter,
    prerequisites,
    projects,
    runs,
    selectedFlowId,
    selectedProjectId,
    setDrawer,
    setFlowFilter,
    setSelectedFlowId,
    setSelectedProjectId,
    variables,
  } = useAppState();

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;

  const visibleFlows = useMemo(() => {
    if (!selectedProject) {
      return [];
    }

    const projectFlows = flows.filter((flow) => flow.projectId === selectedProject.id);

    if (flowFilter === "active") {
      return projectFlows.filter((flow) => flow.enabled);
    }

    if (flowFilter === "failing") {
      return projectFlows.filter(
        (flow) =>
          flow.status === "failed" ||
          flow.status === "prerequisite_failed" ||
          flow.status === "timed_out",
      );
    }

    return projectFlows;
  }, [flowFilter, flows, selectedProject]);

  useEffect(() => {
    if (!projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id ?? "");
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    if (!visibleFlows.some((flow) => flow.id === selectedFlowId)) {
      setSelectedFlowId(visibleFlows[0]?.id ?? "");
    }
  }, [selectedFlowId, setSelectedFlowId, visibleFlows]);

  const selectedFlow =
    flows.find(
      (flow) => flow.id === selectedFlowId && flow.projectId === selectedProject?.id,
    ) ??
    visibleFlows[0] ??
    null;

  const selectedProjectVariables = variables.filter(
    (variable) => variable.projectId === selectedProject?.id,
  );
  const selectedFlowPrerequisites = prerequisites.filter(
    (prerequisite) => prerequisite.flowId === selectedFlow?.id,
  );
  const selectedFlowRuns = runs.filter((run) => run.flowId === selectedFlow?.id);
  const selectedProjectAlarms = getRecentProjectAlarms(alarms, selectedProject?.id);
  const selectedFlowState = flowStateEntries.filter(
    (entry) => entry.flowId === selectedFlow?.id,
  );
  const activeExecutionFlowIds = new Set(
    activeExecutions.map((execution) => execution.flowId),
  );
  const projectStats = deriveProjectStats(selectedProject, flows, activeExecutions);

  function openDrawer(drawer: DrawerState) {
    setDrawer(drawer);
  }

  function setFilter(filter: FlowFilter) {
    setFlowFilter(filter);
  }

  return (
    <div className="grid gap-6 xl:h-[calc(100vh-9rem)] xl:grid-cols-[300px_minmax(0,1fr)] xl:overflow-hidden">
      <ProjectSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />

      <section className="space-y-6 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
        <ProjectHeader
          selectedProject={selectedProject}
          selectedFlowId={selectedFlow?.id}
          projectStats={projectStats}
          onOpenDrawer={openDrawer}
        />

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <div className="space-y-6">
            <FlowListSection
              selectedProject={selectedProject}
              flows={flows}
              visibleFlows={visibleFlows}
              selectedFlowId={selectedFlowId}
              flowFilter={flowFilter}
              activeExecutionFlowIds={activeExecutionFlowIds}
              onSelectFlow={setSelectedFlowId}
              onSetFilter={setFilter}
              onOpenDrawer={openDrawer}
            />

            <ProjectMetaPanels
              selectedProject={selectedProject}
              selectedProjectVariables={selectedProjectVariables}
              selectedProjectAlarms={selectedProjectAlarms}
              onOpenDrawer={openDrawer}
            />
          </div>

          <FlowInspectorPanels
            selectedFlow={selectedFlow}
            selectedProject={selectedProject}
            selectedFlowPrerequisites={selectedFlowPrerequisites}
            selectedFlowState={selectedFlowState}
            selectedFlowRuns={selectedFlowRuns}
            onOpenDrawer={openDrawer}
          />
        </div>
      </section>
    </div>
  );
}
