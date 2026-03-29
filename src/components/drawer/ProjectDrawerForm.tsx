import { useEffect, useState } from "react";

import { withProjectCounts } from "../../lib/project-summary";
import { createProject, updateProject } from "../../services/project-api";
import { useAppState } from "../../state/AppStateContext";
import type { ProjectDraft } from "../../types/app";
import { DrawerActions } from "../ui/buttons";
import { Input, TextArea, ToggleGroup } from "../ui/form-controls";
import { Field } from "../ui/layout";

export function ProjectDrawerForm() {
  const {
    drawer,
    flows,
    projects,
    setDrawer,
    setProjects,
    setSelectedProjectId,
    variables,
  } = useAppState();

  if (drawer.type !== "project") {
    return null;
  }

  const projectValue =
    drawer.mode === "edit"
      ? projects.find((project) => project.id === drawer.projectId)
      : null;

  const [draft, setDraft] = useState<ProjectDraft>({
    name: "",
    description: "",
    enabled: true,
  });

  useEffect(() => {
    setDraft({
      name: projectValue?.name ?? "",
      description: projectValue?.description ?? "",
      enabled: projectValue?.enabled ?? true,
    });
  }, [projectValue]);

  return (
    <>
      <Field label="Project name">
        <Input
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Production API"
        />
      </Field>
      <Field label="Description">
        <TextArea
          value={draft.description}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="High-level monitoring purpose for this project."
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
                const createdProject = await createProject({
                  name: draft.name || "Untitled project",
                  description: draft.description,
                  enabled: draft.enabled,
                });
                const nextProject = withProjectCounts(
                  createdProject,
                  flows,
                  variables,
                );

                setProjects((current) => [nextProject, ...current]);
                setSelectedProjectId(nextProject.id);
              } else if (drawer.projectId) {
                const updatedProject = await updateProject(drawer.projectId, {
                  name: draft.name,
                  description: draft.description,
                  enabled: draft.enabled,
                });
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
        saveLabel={drawer.mode === "create" ? "Create project" : "Save project"}
      />
    </>
  );
}
