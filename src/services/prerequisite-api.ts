import { invoke } from "@tauri-apps/api/core";

import type { PrerequisiteDraft, PrerequisiteSummary } from "../types/app";

function parseArgs(argsText: string) {
  return argsText
    .split(" ")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function listPrerequisites() {
  return invoke<PrerequisiteSummary[]>("list_prerequisites");
}

export function createPrerequisite(flowId: string, input: PrerequisiteDraft) {
  return invoke<PrerequisiteSummary>("create_prerequisite", {
    input: {
      flowId,
      name: input.name || "New prerequisite",
      executablePath: input.executablePath,
      args: parseArgs(input.args),
      enabled: input.enabled,
      status: input.status,
    },
  });
}

export function updatePrerequisite(
  id: string,
  flowId: string,
  input: PrerequisiteDraft,
) {
  return invoke<PrerequisiteSummary>("update_prerequisite", {
    input: {
      id,
      flowId,
      name: input.name,
      executablePath: input.executablePath,
      args: parseArgs(input.args),
      enabled: input.enabled,
      status: input.status,
    },
  });
}

export function deletePrerequisite(id: string) {
  return invoke<void>("delete_prerequisite", {
    input: { id },
  });
}
