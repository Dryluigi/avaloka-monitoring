import type { FlowSummary, ProjectSummary, ProjectVariable } from "../types/app";

export function withProjectCounts(
  project: ProjectSummary,
  flows: FlowSummary[],
  variables: ProjectVariable[],
) {
  const projectFlows = flows.filter((flow) => flow.projectId === project.id);
  const projectVariables = variables.filter(
    (variable) => variable.projectId === project.id,
  );

  return {
    ...project,
    flowCount: projectFlows.length,
    variableCount: projectVariables.filter((variable) => !variable.isSecret)
      .length,
    secretCount: projectVariables.filter((variable) => variable.isSecret).length,
  };
}

export function withProjectCollectionCounts(
  projects: ProjectSummary[],
  flows: FlowSummary[],
  variables: ProjectVariable[],
) {
  return projects.map((project) => withProjectCounts(project, flows, variables));
}
