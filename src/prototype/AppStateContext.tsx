import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  MOCK_FLOWS,
  MOCK_PREREQUISITES,
  MOCK_PROJECTS,
  MOCK_VARIABLES,
} from "./mock-data";
import type {
  DrawerState,
  FlowFilter,
  FlowSummary,
  ProjectSummary,
  ProjectVariable,
  PrerequisiteSummary,
} from "./types";

type AppStateContextValue = {
  projects: ProjectSummary[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectSummary[]>>;
  flows: FlowSummary[];
  setFlows: React.Dispatch<React.SetStateAction<FlowSummary[]>>;
  variables: ProjectVariable[];
  setVariables: React.Dispatch<React.SetStateAction<ProjectVariable[]>>;
  prerequisites: PrerequisiteSummary[];
  setPrerequisites: React.Dispatch<React.SetStateAction<PrerequisiteSummary[]>>;
  selectedProjectId: string;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string>>;
  selectedFlowId: string;
  setSelectedFlowId: React.Dispatch<React.SetStateAction<string>>;
  flowFilter: FlowFilter;
  setFlowFilter: React.Dispatch<React.SetStateAction<FlowFilter>>;
  drawer: DrawerState;
  setDrawer: React.Dispatch<React.SetStateAction<DrawerState>>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider(props: { children: ReactNode }) {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [flows, setFlows] = useState(MOCK_FLOWS);
  const [variables, setVariables] = useState(MOCK_VARIABLES);
  const [prerequisites, setPrerequisites] = useState(MOCK_PREREQUISITES);
  const [selectedProjectId, setSelectedProjectId] = useState(MOCK_PROJECTS[0]?.id ?? "");
  const [selectedFlowId, setSelectedFlowId] = useState(MOCK_FLOWS[0]?.id ?? "");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [drawer, setDrawer] = useState<DrawerState>({ type: null });

  const value = useMemo(
    () => ({
      projects,
      setProjects,
      flows,
      setFlows,
      variables,
      setVariables,
      prerequisites,
      setPrerequisites,
      selectedProjectId,
      setSelectedProjectId,
      selectedFlowId,
      setSelectedFlowId,
      flowFilter,
      setFlowFilter,
      drawer,
      setDrawer,
    }),
    [
      drawer,
      flowFilter,
      flows,
      prerequisites,
      projects,
      selectedFlowId,
      selectedProjectId,
      variables,
    ],
  );

  return <AppStateContext.Provider value={value}>{props.children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);

  if (!value) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return value;
}
