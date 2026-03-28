import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  MOCK_FLOWS,
  MOCK_PREREQUISITES,
  MOCK_VARIABLES,
} from "./mock-data";
import { listProjects } from "./project-api";
import { withProjectCollectionCounts } from "./project-summary";
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
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [flows, setFlows] = useState(MOCK_FLOWS);
  const [variables, setVariables] = useState(MOCK_VARIABLES);
  const [prerequisites, setPrerequisites] = useState(MOCK_PREREQUISITES);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFlowId, setSelectedFlowId] = useState(MOCK_FLOWS[0]?.id ?? "");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [drawer, setDrawer] = useState<DrawerState>({ type: null });

  useEffect(() => {
    let ignore = false;

    async function loadPersistedProjects() {
      try {
        const persistedProjects = await listProjects();

        if (!ignore) {
          setProjects(withProjectCollectionCounts(persistedProjects, MOCK_FLOWS, MOCK_VARIABLES));
        }
      } catch (error) {
        console.error("Failed to load persisted projects", error);
      }
    }

    void loadPersistedProjects();

    return () => {
      ignore = true;
    };
  }, []);

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
