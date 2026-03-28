export type AppSection = "dashboard" | "projects" | "runs" | "alarms";

export type FlowStatus =
  | "success"
  | "failed"
  | "timed_out"
  | "prerequisite_failed"
  | "disabled";

export type FlowFilter = "all" | "active" | "failing";

export type ProjectSummary = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  variableCount: number;
  secretCount: number;
  flowCount: number;
};

export type FlowSummary = {
  id: string;
  projectId: string;
  name: string;
  enabled: boolean;
  intervalLabel: string;
  status: FlowStatus;
  lastRunAt: string;
  nextRunAt: string;
  executablePath: string;
  args: string[];
  workingDirectory: string;
  timeoutSeconds: number;
  stateCount: number;
};

export type ProjectVariable = {
  id: string;
  projectId: string;
  key: string;
  value: string;
  isSecret: boolean;
};

export type PrerequisiteSummary = {
  id: string;
  flowId: string;
  name: string;
  executablePath: string;
  args: string[];
  status: "ready" | "success" | "failed";
};

export type FlowRunSummary = {
  id: string;
  flowId: string;
  flowName: string;
  projectId: string;
  projectName: string;
  status: FlowStatus;
  startedAt: string;
  finishedAt: string;
  durationLabel: string;
  summary: string;
  failureMessage: string | null;
};

export type AlarmSummary = {
  id: string;
  flowId: string;
  flowName: string;
  projectId: string;
  projectName: string;
  severity: "warning" | "critical";
  createdAt: string;
  message: string;
};

export type FlowStateEntry = {
  id: string;
  flowId: string;
  key: string;
  value: string;
  updatedAt: string;
};

export type ActiveExecutionSummary = {
  id: string;
  flowId: string;
  flowName: string;
  projectId: string;
  projectName: string;
  stage: "prerequisite" | "main";
  startedAt: string;
  elapsedLabel: string;
  note: string;
};

export type DrawerState =
  | { type: null }
  | { type: "project"; mode: "create" | "edit"; projectId?: string }
  | { type: "flow"; mode: "create" | "edit"; projectId: string; flowId?: string }
  | { type: "variable"; mode: "create" | "edit"; projectId: string; variableId?: string }
  | { type: "prerequisite"; mode: "create" | "edit"; flowId: string; prerequisiteId?: string };

export type ProjectDraft = {
  name: string;
  description: string;
  enabled: boolean;
};

export type FlowDraft = {
  name: string;
  enabled: boolean;
  intervalLabel: string;
  executablePath: string;
  args: string;
  workingDirectory: string;
  timeoutSeconds: string;
};

export type VariableDraft = {
  key: string;
  value: string;
  isSecret: boolean;
};

export type PrerequisiteDraft = {
  name: string;
  executablePath: string;
  args: string;
  status: "ready" | "success" | "failed";
};
