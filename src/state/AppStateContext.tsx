import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { withProjectCollectionCounts } from "../lib/project-summary";
import { listFlows } from "../services/flow-api";
import { listPrerequisites } from "../services/prerequisite-api";
import { listProjects } from "../services/project-api";
import { listProjectVariables } from "../services/project-variable-api";
import { listAlarms, listFlowRuns, listFlowState } from "../services/runtime-read-api";
import type {
  AlarmSummary,
  DrawerState,
  FlowFilter,
  FlowRunSummary,
  FlowStateEntry,
  FlowSummary,
  ProjectSummary,
  ProjectVariable,
  PrerequisiteSummary,
} from "../types/app";

type AppStateContextValue = {
  projects: ProjectSummary[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectSummary[]>>;
  flows: FlowSummary[];
  setFlows: React.Dispatch<React.SetStateAction<FlowSummary[]>>;
  variables: ProjectVariable[];
  setVariables: React.Dispatch<React.SetStateAction<ProjectVariable[]>>;
  prerequisites: PrerequisiteSummary[];
  setPrerequisites: React.Dispatch<React.SetStateAction<PrerequisiteSummary[]>>;
  runs: FlowRunSummary[];
  setRuns: React.Dispatch<React.SetStateAction<FlowRunSummary[]>>;
  alarms: AlarmSummary[];
  setAlarms: React.Dispatch<React.SetStateAction<AlarmSummary[]>>;
  flowStateEntries: FlowStateEntry[];
  setFlowStateEntries: React.Dispatch<React.SetStateAction<FlowStateEntry[]>>;
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
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [variables, setVariables] = useState<ProjectVariable[]>([]);
  const [prerequisites, setPrerequisites] = useState<PrerequisiteSummary[]>([]);
  const [runs, setRuns] = useState<FlowRunSummary[]>([]);
  const [alarms, setAlarms] = useState<AlarmSummary[]>([]);
  const [flowStateEntries, setFlowStateEntries] = useState<FlowStateEntry[]>(
    [],
  );
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [drawer, setDrawer] = useState<DrawerState>({ type: null });

  useEffect(() => {
    let ignore = false;

    async function loadPersistedData() {
      try {
        const [
          persistedProjects,
          persistedFlows,
          persistedVariables,
          persistedPrerequisites,
          persistedRuns,
          persistedAlarms,
          persistedFlowState,
        ] = await Promise.all([
          listProjects(),
          listFlows(),
          listProjectVariables(),
          listPrerequisites(),
          listFlowRuns(),
          listAlarms(),
          listFlowState(),
        ]);

        if (!ignore) {
          setFlows(persistedFlows);
          setVariables(persistedVariables);
          setPrerequisites(persistedPrerequisites);
          setRuns(persistedRuns);
          setAlarms(persistedAlarms);
          setFlowStateEntries(persistedFlowState);
          setProjects(
            withProjectCollectionCounts(
              persistedProjects,
              persistedFlows,
              persistedVariables,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load persisted app data", error);
      }
    }

    void loadPersistedData();

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
      runs,
      setRuns,
      alarms,
      setAlarms,
      flowStateEntries,
      setFlowStateEntries,
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
      flowStateEntries,
      prerequisites,
      projects,
      runs,
      selectedFlowId,
      selectedProjectId,
      variables,
      alarms,
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
