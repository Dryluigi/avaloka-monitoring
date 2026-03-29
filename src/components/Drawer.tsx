import { useEffect, useState } from "react";

import { getDrawerTitle } from "../lib/config";
import { withProjectCounts } from "../lib/project-summary";
import { createFlow, deleteFlow, updateFlow } from "../services/flow-api";
import { createProject, updateProject } from "../services/project-api";
import { useAppState } from "../state/AppStateContext";
import type {
  FlowDraft,
  PrerequisiteDraft,
  ProjectDraft,
  VariableDraft,
} from "../types/app";
import { DrawerActions } from "./ui/buttons";
import { Input, TextArea, ToggleGroup } from "./ui/form-controls";
import { Field } from "./ui/layout";

export function Drawer() {
  const {
    projects,
    flows,
    variables,
    prerequisites,
    drawer,
    setDrawer,
    setProjects,
    setFlows,
    setSelectedFlowId,
    setSelectedProjectId,
    setVariables,
    setPrerequisites,
  } = useAppState();
  const title = getDrawerTitle(drawer);

  const projectValue =
    drawer.type === "project" && drawer.mode === "edit"
      ? projects.find((project) => project.id === drawer.projectId)
      : null;
  const flowValue =
    drawer.type === "flow" && drawer.mode === "edit"
      ? flows.find((flow) => flow.id === drawer.flowId)
      : null;
  const variableValue =
    drawer.type === "variable" && drawer.mode === "edit"
      ? variables.find((variable) => variable.id === drawer.variableId)
      : null;
  const prerequisiteValue =
    drawer.type === "prerequisite" && drawer.mode === "edit"
      ? prerequisites.find(
          (prerequisite) => prerequisite.id === drawer.prerequisiteId,
        )
      : null;

  const [projectDraft, setProjectDraft] = useState<ProjectDraft>({
    name: "",
    description: "",
    enabled: true,
  });
  const [flowDraft, setFlowDraft] = useState<FlowDraft>({
    name: "",
    enabled: true,
    intervalLabel: "Every 15 min",
    executablePath: "",
    args: "",
    workingDirectory: "",
    timeoutSeconds: "60",
  });
  const [variableDraft, setVariableDraft] = useState<VariableDraft>({
    key: "",
    value: "",
    isSecret: false,
  });
  const [prerequisiteDraft, setPrerequisiteDraft] = useState<PrerequisiteDraft>(
    {
      name: "",
      executablePath: "",
      args: "",
      status: "ready",
    },
  );

  useEffect(() => {
    if (drawer.type === "project") {
      setProjectDraft({
        name: projectValue?.name ?? "",
        description: projectValue?.description ?? "",
        enabled: projectValue?.enabled ?? true,
      });
    } else if (drawer.type === "flow") {
      setFlowDraft({
        name: flowValue?.name ?? "",
        enabled: flowValue?.enabled ?? true,
        intervalLabel: flowValue?.intervalLabel ?? "Every 15 min",
        executablePath: flowValue?.executablePath ?? "",
        args: flowValue?.args.join(" ") ?? "",
        workingDirectory: flowValue?.workingDirectory ?? "",
        timeoutSeconds: String(flowValue?.timeoutSeconds ?? 60),
      });
    } else if (drawer.type === "variable") {
      setVariableDraft({
        key: variableValue?.key ?? "",
        value: variableValue?.isSecret ? "" : (variableValue?.value ?? ""),
        isSecret: variableValue?.isSecret ?? false,
      });
    } else if (drawer.type === "prerequisite") {
      setPrerequisiteDraft({
        name: prerequisiteValue?.name ?? "",
        executablePath: prerequisiteValue?.executablePath ?? "",
        args: prerequisiteValue?.args.join(" ") ?? "",
        status: prerequisiteValue?.status ?? "ready",
      });
    }
  }, [drawer, flowValue, prerequisiteValue, projectValue, variableValue]);

  if (drawer.type === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
      <div
        className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-[-24px_0_60px_rgba(15,23,42,0.12)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
              App drawer
            </div>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Forms are intentionally local-only so we can validate editing flow
              before wiring persistence.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawer({ type: null })}
            className="rounded-2xl border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-slate-500 transition hover:border-[var(--border-strong)] hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {drawer.type === "project" ? (
            <>
              <Field label="Project name">
                <Input
                  value={projectDraft.name}
                  onChange={(event) =>
                    setProjectDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Production API"
                />
              </Field>
              <Field label="Description">
                <TextArea
                  value={projectDraft.description}
                  onChange={(event) =>
                    setProjectDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="High-level monitoring purpose for this project."
                />
              </Field>
              <Field label="Status">
                <ToggleGroup
                  value={projectDraft.enabled ? "enabled" : "disabled"}
                  options={[
                    { value: "enabled", label: "Enabled" },
                    { value: "disabled", label: "Disabled" },
                  ]}
                  onChange={(value) =>
                    setProjectDraft((current) => ({
                      ...current,
                      enabled: value === "enabled",
                    }))
                  }
                />
              </Field>
              <DrawerActions
                onCancel={() => setDrawer({ type: null })}
                onSave={() => {
                  void (async () => {
                    try {
                      if (drawer.mode === "create") {
                        const createdProject = await createProject({
                          name: projectDraft.name || "Untitled project",
                          description: projectDraft.description,
                          enabled: projectDraft.enabled,
                        });
                        const nextProject = withProjectCounts(
                          createdProject,
                          flows,
                          variables,
                        );

                        setProjects((current) => [nextProject, ...current]);
                        setSelectedProjectId(nextProject.id);
                      } else if (drawer.projectId) {
                        const updatedProject = await updateProject(
                          drawer.projectId,
                          {
                            name: projectDraft.name,
                            description: projectDraft.description,
                            enabled: projectDraft.enabled,
                          },
                        );
                        const nextProject = withProjectCounts(
                          updatedProject,
                          flows,
                          variables,
                        );

                        setProjects((current) =>
                          current.map((project) =>
                            project.id === drawer.projectId ? nextProject : project,
                          ),
                        );
                      }

                      setDrawer({ type: null });
                    } catch (error) {
                      console.error("Failed to persist project", error);
                    }
                  })();
                }}
                saveLabel={
                  drawer.mode === "create" ? "Create project" : "Save project"
                }
              />
            </>
          ) : null}

          {drawer.type === "flow" ? (
            <>
              <Field label="Flow name">
                <Input
                  value={flowDraft.name}
                  onChange={(event) =>
                    setFlowDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Login health check"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Interval">
                  <Input
                    value={flowDraft.intervalLabel}
                    onChange={(event) =>
                      setFlowDraft((current) => ({
                        ...current,
                        intervalLabel: event.target.value,
                      }))
                    }
                    placeholder="Every 15 min"
                  />
                </Field>
                <Field label="Timeout (seconds)">
                  <Input
                    value={flowDraft.timeoutSeconds}
                    onChange={(event) =>
                      setFlowDraft((current) => ({
                        ...current,
                        timeoutSeconds: event.target.value,
                      }))
                    }
                    placeholder="60"
                  />
                </Field>
              </div>
              <Field label="Executable path">
                <Input
                  value={flowDraft.executablePath}
                  onChange={(event) =>
                    setFlowDraft((current) => ({
                      ...current,
                      executablePath: event.target.value,
                    }))
                  }
                  placeholder="/usr/bin/python3"
                />
              </Field>
              <Field label="Arguments">
                <Input
                  value={flowDraft.args}
                  onChange={(event) =>
                    setFlowDraft((current) => ({
                      ...current,
                      args: event.target.value,
                    }))
                  }
                  placeholder="scripts/check_login.py"
                />
              </Field>
              <Field label="Working directory">
                <Input
                  value={flowDraft.workingDirectory}
                  onChange={(event) =>
                    setFlowDraft((current) => ({
                      ...current,
                      workingDirectory: event.target.value,
                    }))
                  }
                  placeholder="/Users/demo/monitoring/api"
                />
              </Field>
              <Field label="Status">
                <ToggleGroup
                  value={flowDraft.enabled ? "enabled" : "disabled"}
                  options={[
                    { value: "enabled", label: "Enabled" },
                    { value: "disabled", label: "Disabled" },
                  ]}
                  onChange={(value) =>
                    setFlowDraft((current) => ({
                      ...current,
                      enabled: value === "enabled",
                    }))
                  }
                />
              </Field>
              <DrawerActions
                onCancel={() => setDrawer({ type: null })}
                onSave={() => {
                  void (async () => {
                    try {
                      if (drawer.mode === "create") {
                        const createdFlow = await createFlow(
                          drawer.projectId,
                          flowDraft,
                        );

                        setFlows((current) => [createdFlow, ...current]);
                        setSelectedFlowId(createdFlow.id);
                        setProjects((current) =>
                          current.map((project) =>
                            project.id === drawer.projectId
                              ? withProjectCounts(
                                  project,
                                  [createdFlow, ...flows],
                                  variables,
                                )
                              : project,
                          ),
                        );
                      } else if (drawer.flowId) {
                        const updatedFlow = await updateFlow(
                          drawer.flowId,
                          drawer.projectId,
                          flowDraft,
                        );

                        setFlows((current) =>
                          current.map((flow) =>
                            flow.id === drawer.flowId ? updatedFlow : flow,
                          ),
                        );
                        setProjects((current) =>
                          current.map((project) =>
                            project.id === drawer.projectId
                              ? withProjectCounts(
                                  project,
                                  flows.map((flow) =>
                                    flow.id === drawer.flowId ? updatedFlow : flow,
                                  ),
                                  variables,
                                )
                              : project,
                          ),
                        );
                      }

                      setDrawer({ type: null });
                    } catch (error) {
                      console.error("Failed to persist flow", error);
                    }
                  })();
                }}
                saveLabel={
                  drawer.mode === "create" ? "Create flow" : "Save flow"
                }
                onDestructive={
                  drawer.mode === "edit" && drawer.flowId
                    ? () => {
                        void (async () => {
                          try {
                            const flowId = drawer.flowId;

                            if (!flowId) {
                              return;
                            }

                            await deleteFlow(flowId);

                            const remainingFlows = flows.filter(
                              (flow) => flow.id !== flowId,
                            );
                            const nextProjectFlows = remainingFlows.filter(
                              (flow) => flow.projectId === drawer.projectId,
                            );

                            setFlows(remainingFlows);
                            setProjects((current) =>
                              current.map((project) =>
                                project.id === drawer.projectId
                                  ? withProjectCounts(
                                      project,
                                      remainingFlows,
                                      variables,
                                    )
                                  : project,
                              ),
                            );
                            setSelectedFlowId(nextProjectFlows[0]?.id ?? "");
                            setDrawer({ type: null });
                          } catch (error) {
                            console.error("Failed to delete flow", error);
                          }
                        })();
                      }
                    : undefined
                }
                destructiveLabel={
                  drawer.mode === "edit" ? "Delete flow" : undefined
                }
              />
            </>
          ) : null}

          {drawer.type === "variable" ? (
            <>
              <Field label="Variable key">
                <Input
                  value={variableDraft.key}
                  onChange={(event) =>
                    setVariableDraft((current) => ({
                      ...current,
                      key: event.target.value,
                    }))
                  }
                  placeholder="API_BASE_URL"
                />
              </Field>
              <Field label="Value">
                <Input
                  value={variableDraft.value}
                  onChange={(event) =>
                    setVariableDraft((current) => ({
                      ...current,
                      value: event.target.value,
                    }))
                  }
                  placeholder={
                    variableDraft.isSecret
                      ? "Secret value"
                      : "https://api.example.com"
                  }
                />
              </Field>
              <Field label="Type">
                <ToggleGroup
                  value={variableDraft.isSecret ? "secret" : "plain"}
                  options={[
                    { value: "plain", label: "Plain" },
                    { value: "secret", label: "Secret" },
                  ]}
                  onChange={(value) =>
                    setVariableDraft((current) => ({
                      ...current,
                      isSecret: value === "secret",
                    }))
                  }
                />
              </Field>
              <DrawerActions
                onCancel={() => setDrawer({ type: null })}
                onSave={() => {
                  if (drawer.mode === "create") {
                    const nextVariable = {
                      id: `var-${Date.now()}`,
                      projectId: drawer.projectId,
                      key: variableDraft.key,
                      value: variableDraft.isSecret
                        ? "••••••••••••"
                        : variableDraft.value,
                      isSecret: variableDraft.isSecret,
                    };

                    setVariables((current) => [nextVariable, ...current]);
                    setProjects((current) =>
                      current.map((project) =>
                        project.id === drawer.projectId
                          ? {
                              ...project,
                              variableCount:
                                project.variableCount +
                                (variableDraft.isSecret ? 0 : 1),
                              secretCount:
                                project.secretCount +
                                (variableDraft.isSecret ? 1 : 0),
                            }
                          : project,
                      ),
                    );
                  } else if (drawer.variableId) {
                    setVariables((current) =>
                      current.map((variable) =>
                        variable.id === drawer.variableId
                          ? {
                              ...variable,
                              key: variableDraft.key,
                              value: variableDraft.isSecret
                                ? "••••••••••••"
                                : variableDraft.value,
                              isSecret: variableDraft.isSecret,
                            }
                          : variable,
                      ),
                    );
                  }

                  setDrawer({ type: null });
                }}
                saveLabel={
                  drawer.mode === "create" ? "Create variable" : "Save variable"
                }
              />
            </>
          ) : null}

          {drawer.type === "prerequisite" ? (
            <>
              <Field label="Prerequisite name">
                <Input
                  value={prerequisiteDraft.name}
                  onChange={(event) =>
                    setPrerequisiteDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Verify VPN route"
                />
              </Field>
              <Field label="Executable path">
                <Input
                  value={prerequisiteDraft.executablePath}
                  onChange={(event) =>
                    setPrerequisiteDraft((current) => ({
                      ...current,
                      executablePath: event.target.value,
                    }))
                  }
                  placeholder="/usr/bin/bash"
                />
              </Field>
              <Field label="Arguments">
                <Input
                  value={prerequisiteDraft.args}
                  onChange={(event) =>
                    setPrerequisiteDraft((current) => ({
                      ...current,
                      args: event.target.value,
                    }))
                  }
                  placeholder="scripts/check_vpn.sh"
                />
              </Field>
              <Field label="Preview status">
                <ToggleGroup
                  value={prerequisiteDraft.status}
                  options={[
                    { value: "ready", label: "Ready" },
                    { value: "success", label: "Success" },
                    { value: "failed", label: "Failed" },
                  ]}
                  onChange={(value) =>
                    setPrerequisiteDraft((current) => ({
                      ...current,
                      status: value as PrerequisiteDraft["status"],
                    }))
                  }
                />
              </Field>
              <DrawerActions
                onCancel={() => setDrawer({ type: null })}
                onSave={() => {
                  const parsedArgs = prerequisiteDraft.args
                    .split(" ")
                    .map((value) => value.trim())
                    .filter(Boolean);

                  if (drawer.mode === "create") {
                    const nextPrerequisite = {
                      id: `pre-${Date.now()}`,
                      flowId: drawer.flowId,
                      name: prerequisiteDraft.name || "New prerequisite",
                      executablePath: prerequisiteDraft.executablePath,
                      args: parsedArgs,
                      status: prerequisiteDraft.status,
                    };

                    setPrerequisites((current) => [
                      nextPrerequisite,
                      ...current,
                    ]);
                  } else if (drawer.prerequisiteId) {
                    setPrerequisites((current) =>
                      current.map((prerequisite) =>
                        prerequisite.id === drawer.prerequisiteId
                          ? {
                              ...prerequisite,
                              name: prerequisiteDraft.name,
                              executablePath: prerequisiteDraft.executablePath,
                              args: parsedArgs,
                              status: prerequisiteDraft.status,
                            }
                          : prerequisite,
                      ),
                    );
                  }

                  setDrawer({ type: null });
                }}
                saveLabel={
                  drawer.mode === "create"
                    ? "Create prerequisite"
                    : "Save prerequisite"
                }
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
