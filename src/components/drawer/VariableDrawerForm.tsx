import { useEffect, useState } from "react";

import { withProjectCounts } from "../../lib/project-summary";
import {
  createProjectVariable,
  deleteProjectVariable,
  updateProjectVariable,
} from "../../services/project-variable-api";
import { useAppState } from "../../state/AppStateContext";
import type { VariableDraft } from "../../types/app";
import { DrawerActions } from "../ui/buttons";
import { Input, ToggleGroup } from "../ui/form-controls";
import { Field } from "../ui/layout";

export function VariableDrawerForm() {
  const {
    drawer,
    flows,
    setDrawer,
    setProjects,
    setVariables,
    variables,
  } = useAppState();

  if (drawer.type !== "variable") {
    return null;
  }

  const variableValue =
    drawer.mode === "edit"
      ? variables.find((variable) => variable.id === drawer.variableId)
      : null;

  const [draft, setDraft] = useState<VariableDraft>({
    key: "",
    value: "",
    isSecret: false,
  });

  useEffect(() => {
    setDraft({
      key: variableValue?.key ?? "",
      value: variableValue?.isSecret ? "" : (variableValue?.value ?? ""),
      isSecret: variableValue?.isSecret ?? false,
    });
  }, [variableValue]);

  return (
    <>
      <Field label="Variable key">
        <Input
          value={draft.key}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              key: event.target.value,
            }))
          }
          placeholder="API_BASE_URL"
        />
      </Field>
      <Field label="Value">
        <Input
          type={draft.isSecret ? "password" : "text"}
          value={draft.value}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              value: event.target.value,
            }))
          }
          placeholder={draft.isSecret ? "Secret value" : "https://api.example.com"}
        />
      </Field>
      <Field label="Type">
        <ToggleGroup
          value={draft.isSecret ? "secret" : "plain"}
          options={[
            {
              value: "plain",
              label: "Plain",
              description: "Visible in the UI and returned as a normal value.",
            },
            {
              value: "secret",
              label: "Secret",
              description: "Masked in the UI and intended for sensitive runtime use.",
              tone: "secret",
            },
          ]}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              isSecret: value === "secret",
            }))
          }
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Secret values are masked in the UI. Stronger at-rest secret hardening
          is still pending.
        </p>
      </Field>
      <DrawerActions
        onCancel={() => setDrawer({ type: null })}
        onSave={() => {
          void (async () => {
            try {
              if (drawer.mode === "create") {
                const createdVariable = await createProjectVariable(
                  drawer.projectId,
                  draft,
                );
                const nextVariables = [createdVariable, ...variables];

                setVariables(nextVariables);
                setProjects((current) =>
                  current.map((project) =>
                    project.id === drawer.projectId
                      ? withProjectCounts(project, flows, nextVariables)
                      : project,
                  ),
                );
              } else if (drawer.variableId) {
                const updatedVariable = await updateProjectVariable(
                  drawer.variableId,
                  drawer.projectId,
                  draft,
                );
                const nextVariables = variables.map((variable) =>
                  variable.id === drawer.variableId ? updatedVariable : variable,
                );

                setVariables(nextVariables);
                setProjects((current) =>
                  current.map((project) =>
                    project.id === drawer.projectId
                      ? withProjectCounts(project, flows, nextVariables)
                      : project,
                  ),
                );
              }

              setDrawer({ type: null });
            } catch (error) {
              console.error("Failed to persist project variable", error);
            }
          })();
        }}
        saveLabel={drawer.mode === "create" ? "Create variable" : "Save variable"}
        onDestructive={
          drawer.mode === "edit" && drawer.variableId
            ? () => {
                void (async () => {
                  try {
                    const variableId = drawer.variableId;

                    if (!variableId) {
                      return;
                    }

                    await deleteProjectVariable(variableId);

                    const nextVariables = variables.filter(
                      (variable) => variable.id !== variableId,
                    );

                    setVariables(nextVariables);
                    setProjects((current) =>
                      current.map((project) =>
                        project.id === drawer.projectId
                          ? withProjectCounts(project, flows, nextVariables)
                          : project,
                      ),
                    );
                    setDrawer({ type: null });
                  } catch (error) {
                    console.error("Failed to delete project variable", error);
                  }
                })();
              }
            : undefined
        }
        destructiveLabel={drawer.mode === "edit" ? "Delete variable" : undefined}
      />
    </>
  );
}
