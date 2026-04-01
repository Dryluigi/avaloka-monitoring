import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listen } from "@tauri-apps/api/event";

import { APP_EVENTS } from "../lib/constants";
import { withProjectCollectionCounts } from "../lib/project-summary";
import { listFlows } from "../services/flow-api";
import { listPrerequisites } from "../services/prerequisite-api";
import { listProjects } from "../services/project-api";
import { listProjectVariables } from "../services/project-variable-api";
import { listAlarms, listFlowRuns, listFlowState } from "../services/runtime-read-api";
import type {
  ActiveExecutionSummary,
  AlarmCreatedEvent,
  AlarmSummary,
  DrawerState,
  FlowFilter,
  FlowExecutionFinishedEvent,
  FlowExecutionStartedEvent,
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
  activeExecutions: ActiveExecutionSummary[];
  setActiveExecutions: React.Dispatch<
    React.SetStateAction<ActiveExecutionSummary[]>
  >;
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
  const [activeExecutions, setActiveExecutions] = useState<
    ActiveExecutionSummary[]
  >([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [drawer, setDrawer] = useState<DrawerState>({ type: null });

  const loadPersistedData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
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

        if (ignore) {
          return;
        }

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
      } catch (error) {
        console.error("Failed to load persisted app data", error);
      }
    }

    void loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unlistenStarted: (() => void) | undefined;
    let unlistenFinished: (() => void) | undefined;
    let unlistenAlarmCreated: (() => void) | undefined;

    async function registerListeners() {
      unlistenStarted = await listen<FlowExecutionStartedEvent>(
        APP_EVENTS.flowExecutionStarted,
        (event) => {
          if (cancelled) {
            return;
          }

          setActiveExecutions((current) => {
            const filtered = current.filter(
              (execution) => execution.flowId !== event.payload.execution.flowId,
            );

            return [...filtered, event.payload.execution].sort((left, right) =>
              right.startedAt.localeCompare(left.startedAt),
            );
          });
        },
      );

      unlistenFinished = await listen<FlowExecutionFinishedEvent>(
        APP_EVENTS.flowExecutionFinished,
        (event) => {
          if (cancelled) {
            return;
          }

          setActiveExecutions((current) =>
            current.filter((execution) => execution.flowId !== event.payload.flowId),
          );

          void loadPersistedData().catch((error) => {
            console.error(
              "Failed to refresh persisted app data after flow execution",
              error,
            );
          });
        },
      );

      unlistenAlarmCreated = await listen<AlarmCreatedEvent>(
        APP_EVENTS.alarmCreated,
        () => {
          if (cancelled) {
            return;
          }

          void listAlarms()
            .then((persistedAlarms) => {
              if (!cancelled) {
                setAlarms(persistedAlarms);
              }
            })
            .catch((error) => {
              console.error("Failed to refresh alarms after alarm-created event", error);
            });
        },
      );
    }

    void registerListeners();

    return () => {
      cancelled = true;
      unlistenStarted?.();
      unlistenFinished?.();
      unlistenAlarmCreated?.();
    };
  }, [loadPersistedData]);

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
      activeExecutions,
      setActiveExecutions,
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
      activeExecutions,
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
