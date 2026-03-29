import { invoke } from "@tauri-apps/api/core";

import type { FlowDraft, FlowSummary } from "../types/app";

function parseIntervalSeconds(intervalLabel: string) {
  const normalized = intervalLabel.trim().toLowerCase();
  const match = normalized.match(/every\s+(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours)/);

  if (!match) {
    return 900;
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit.startsWith("hr") || unit.startsWith("hour")) {
    return value * 3600;
  }

  if (unit.startsWith("min") || unit.startsWith("minute")) {
    return value * 60;
  }

  return value;
}

function parseArgs(argsText: string) {
  return argsText
    .split(" ")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function listFlows() {
  return invoke<FlowSummary[]>("list_flows");
}

export function createFlow(projectId: string, input: FlowDraft) {
  return invoke<FlowSummary>("create_flow", {
    input: {
      projectId,
      name: input.name || "Untitled flow",
      enabled: input.enabled,
      intervalSeconds: parseIntervalSeconds(input.intervalLabel),
      executablePath: input.executablePath,
      args: parseArgs(input.args),
      workingDirectory: input.workingDirectory,
      timeoutSeconds: Number(input.timeoutSeconds) || 60,
    },
  });
}

export function updateFlow(id: string, projectId: string, input: FlowDraft) {
  return invoke<FlowSummary>("update_flow", {
    input: {
      id,
      projectId,
      name: input.name,
      enabled: input.enabled,
      intervalSeconds: parseIntervalSeconds(input.intervalLabel),
      executablePath: input.executablePath,
      args: parseArgs(input.args),
      workingDirectory: input.workingDirectory,
      timeoutSeconds: Number(input.timeoutSeconds) || 60,
    },
  });
}

export function deleteFlow(id: string) {
  return invoke<void>("delete_flow", {
    input: { id },
  });
}
