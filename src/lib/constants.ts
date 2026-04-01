import type { AppSection } from "../types/app";

export const APP_EVENTS = {
  flowExecutionStarted: "flow-execution-started",
  flowExecutionFinished: "flow-execution-finished",
  alarmCreated: "alarm-created",
} as const;

export const SECTION_TITLES: Record<AppSection, string> = {
  dashboard: "Operational dashboard",
  projects: "Projects",
  runs: "Recent runs",
  alarms: "Alarm center",
};

export const DRAWER_TITLES = {
  project: {
    create: "Create project",
    edit: "Edit project",
  },
  flow: {
    create: "Create flow",
    edit: "Edit flow",
  },
  variable: {
    create: "Create variable",
    edit: "Edit variable",
  },
  prerequisite: {
    create: "Create prerequisite",
    edit: "Edit prerequisite",
  },
} as const;
