import { invoke } from "@tauri-apps/api/core";

import type { ProjectVariable, VariableDraft } from "../types/app";

export function listProjectVariables() {
  return invoke<ProjectVariable[]>("list_project_variables");
}

export function createProjectVariable(projectId: string, input: VariableDraft) {
  return invoke<ProjectVariable>("create_project_variable", {
    input: {
      projectId,
      key: input.key,
      value: input.value,
      isSecret: input.isSecret,
    },
  });
}

export function updateProjectVariable(
  id: string,
  projectId: string,
  input: VariableDraft,
) {
  return invoke<ProjectVariable>("update_project_variable", {
    input: {
      id,
      projectId,
      key: input.key,
      value: input.value,
      isSecret: input.isSecret,
    },
  });
}

export function deleteProjectVariable(id: string) {
  return invoke<void>("delete_project_variable", {
    input: { id },
  });
}
