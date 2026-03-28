import type { AppSection, DrawerState, FlowStatus } from "../types/app";

export const NAV_ITEMS: { id: AppSection; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "One-look execution overview" },
  { id: "projects", label: "Projects", description: "Flows, variables, and state" },
  { id: "runs", label: "Runs", description: "Recent execution timeline" },
  { id: "alarms", label: "Alarms", description: "Latest failures and alerts" },
];

export const STATUS_META: Record<FlowStatus, { label: string; className: string }> = {
  success: {
    label: "Healthy",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  failed: {
    label: "Failed",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  timed_out: {
    label: "Timed out",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  prerequisite_failed: {
    label: "Prereq failed",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  disabled: {
    label: "Disabled",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

export function getDrawerTitle(drawer: DrawerState) {
  if (drawer.type === "project") {
    return drawer.mode === "create" ? "Create project" : "Edit project";
  }

  if (drawer.type === "flow") {
    return drawer.mode === "create" ? "Create flow" : "Edit flow";
  }

  if (drawer.type === "variable") {
    return drawer.mode === "create" ? "Create variable" : "Edit variable";
  }

  if (drawer.type === "prerequisite") {
    return drawer.mode === "create" ? "Create prerequisite" : "Edit prerequisite";
  }

  return "";
}
