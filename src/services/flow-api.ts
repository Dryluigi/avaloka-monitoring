import { invoke } from "@tauri-apps/api/core";

import type { FlowDraft, FlowSummary } from "../types/app";

function parseIntervalSeconds(intervalSeconds: string) {
  const parsed = Number(intervalSeconds.trim());

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 900;
  }

  return Math.floor(parsed);
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
      intervalSeconds: parseIntervalSeconds(input.intervalSeconds),
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
      intervalSeconds: parseIntervalSeconds(input.intervalSeconds),
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
