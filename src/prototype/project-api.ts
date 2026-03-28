import { invoke } from "@tauri-apps/api/core";

import type { ProjectDraft, ProjectSummary } from "./types";

export function listProjects() {
  return invoke<ProjectSummary[]>("list_projects");
}

export function createProject(input: ProjectDraft) {
  return invoke<ProjectSummary>("create_project", { input });
}

export function updateProject(id: string, input: ProjectDraft) {
  return invoke<ProjectSummary>("update_project", {
    input: {
      id,
      ...input,
    },
  });
}

export function deleteProject(id: string) {
  return invoke<void>("delete_project", {
    input: { id },
  });
}
