import { useEffect, useState } from "react";

import { withProjectCounts } from "../../lib/project-summary";
import { formatSecondsBreakdown } from "../../lib/time";
import { createFlow, deleteFlow, updateFlow } from "../../services/flow-api";
import { useAppState } from "../../state/AppStateContext";
import type { FlowDraft } from "../../types/app";
import { DrawerActions } from "../ui/buttons";
import { Input, ToggleGroup } from "../ui/form-controls";
import { Field } from "../ui/layout";

function intervalLabelToSeconds(intervalLabel: string) {
  const normalized = intervalLabel.trim().toLowerCase();
  const match = normalized.match(
    /every\s+(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours)/,
  );

  if (!match) {
    return "900";
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit.startsWith("hr") || unit.startsWith("hour")) {
    return String(value * 3600);
  }

  if (unit.startsWith("min") || unit.startsWith("minute")) {
    return String(value * 60);
  }

  return String(value);
}

function formatReadableInterval(intervalSeconds: string) {
  const parsed = Number(intervalSeconds.trim());

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "Enter a positive number of seconds.";
  }

  return `Runs every ${formatSecondsBreakdown(parsed)}.`;
}

export function FlowDrawerForm() {
  const {
    drawer,
    flows,
    setDrawer,
    setFlows,
    setProjects,
    setSelectedFlowId,
    variables,
  } = useAppState();

  if (drawer.type !== "flow") {
    return null;
  }

  const flowValue =
    drawer.mode === "edit"
      ? flows.find((flow) => flow.id === drawer.flowId)
      : null;

  const [draft, setDraft] = useState<FlowDraft>({
    name: "",
    enabled: true,
    intervalSeconds: "900",
    executablePath: "",
    args: "",
    workingDirectory: "",
    timeoutSeconds: "60",
  });

  useEffect(() => {
    setDraft({
      name: flowValue?.name ?? "",
      enabled: flowValue?.enabled ?? true,
      intervalSeconds: flowValue
        ? intervalLabelToSeconds(flowValue.intervalLabel)
        : "900",
      executablePath: flowValue?.executablePath ?? "",
      args: flowValue?.args.join(" ") ?? "",
      workingDirectory: flowValue?.workingDirectory ?? "",
      timeoutSeconds: String(flowValue?.timeoutSeconds ?? 60),
    });
  }, [flowValue]);

  return (
    <>
      <Field label="Flow name">
        <Input
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Login health check"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Interval (seconds)">
          <Input
            type="number"
            min="1"
            step="1"
            value={draft.intervalSeconds}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                intervalSeconds: event.target.value,
              }))
            }
            placeholder="900"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {formatReadableInterval(draft.intervalSeconds)}
          </p>
        </Field>
        <Field label="Timeout (seconds)">
          <Input
            value={draft.timeoutSeconds}
            onChange={(event) =>
              setDraft((current) => ({
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
          value={draft.executablePath}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              executablePath: event.target.value,
            }))
          }
          placeholder="/usr/bin/python3"
        />
      </Field>
      <Field label="Arguments">
        <Input
          value={draft.args}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              args: event.target.value,
            }))
          }
          placeholder="scripts/check_login.py"
        />
      </Field>
      <Field label="Working directory">
        <Input
          value={draft.workingDirectory}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              workingDirectory: event.target.value,
            }))
          }
          placeholder="/Users/demo/monitoring/api"
        />
      </Field>
      <Field label="Status">
        <ToggleGroup
          value={draft.enabled ? "enabled" : "disabled"}
          options={[
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" },
          ]}
          onChange={(value) =>
            setDraft((current) => ({
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
                const createdFlow = await createFlow(drawer.projectId, draft);

                setFlows((current) => [createdFlow, ...current]);
                setSelectedFlowId(createdFlow.id);
                setProjects((current) =>
                  current.map((project) =>
                    project.id === drawer.projectId
                      ? withProjectCounts(project, [createdFlow, ...flows], variables)
                      : project,
                  ),
                );
              } else if (drawer.flowId) {
                const updatedFlow = await updateFlow(
                  drawer.flowId,
                  drawer.projectId,
                  draft,
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
        saveLabel={drawer.mode === "create" ? "Create flow" : "Save flow"}
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

                    const remainingFlows = flows.filter((flow) => flow.id !== flowId);
                    const nextProjectFlows = remainingFlows.filter(
                      (flow) => flow.projectId === drawer.projectId,
                    );

                    setFlows(remainingFlows);
                    setProjects((current) =>
                      current.map((project) =>
                        project.id === drawer.projectId
                          ? withProjectCounts(project, remainingFlows, variables)
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
        destructiveLabel={drawer.mode === "edit" ? "Delete flow" : undefined}
      />
    </>
  );
}
