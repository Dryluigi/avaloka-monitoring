import { invoke } from "@tauri-apps/api/core";

import type { AlarmSummary, FlowRunSummary, FlowStateEntry } from "../types/app";

export function listFlowRuns() {
  return invoke<FlowRunSummary[]>("list_flow_runs");
}

export function listAlarms() {
  return invoke<AlarmSummary[]>("list_alarms");
}

export function listFlowState() {
  return invoke<FlowStateEntry[]>("list_flow_state");
}
