import { useEffect, useState } from "react";

import {
  createPrerequisite,
  deletePrerequisite,
  updatePrerequisite,
} from "../../services/prerequisite-api";
import { useAppState } from "../../state/AppStateContext";
import type { PrerequisiteDraft } from "../../types/app";
import { DrawerActions } from "../ui/buttons";
import { Input, ToggleGroup } from "../ui/form-controls";
import { Field } from "../ui/layout";

export function PrerequisiteDrawerForm() {
  const { drawer, prerequisites, setDrawer, setPrerequisites } = useAppState();

  if (drawer.type !== "prerequisite") {
    return null;
  }

  const prerequisiteValue =
    drawer.mode === "edit"
      ? prerequisites.find(
          (prerequisite) => prerequisite.id === drawer.prerequisiteId,
        )
      : null;

  const [draft, setDraft] = useState<PrerequisiteDraft>({
    name: "",
    executablePath: "",
    args: "",
    enabled: true,
    status: "ready",
  });

  useEffect(() => {
    setDraft({
      name: prerequisiteValue?.name ?? "",
      executablePath: prerequisiteValue?.executablePath ?? "",
      args: prerequisiteValue?.args.join(" ") ?? "",
      enabled: prerequisiteValue?.enabled ?? true,
      status: prerequisiteValue?.status ?? "ready",
    });
  }, [prerequisiteValue]);

  return (
    <>
      <Field label="Prerequisite name">
        <Input
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Verify VPN route"
        />
      </Field>
      <Field label="Executable path">
        <Input
          value={draft.executablePath}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              executablePath: event.target.value,
            }))
          }
          placeholder="/usr/bin/bash"
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
          placeholder="scripts/check_vpn.sh"
        />
      </Field>
      <Field label="Status">
        <ToggleGroup
          value={draft.enabled ? "enabled" : "disabled"}
          options={[
            {
              value: "enabled",
              label: "Enabled",
              description: "This prerequisite will run before the flow.",
            },
            {
              value: "disabled",
              label: "Disabled",
              description: "This prerequisite is kept in config but skipped.",
            },
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
                const createdPrerequisite = await createPrerequisite(
                  drawer.flowId,
                  draft,
                );

                setPrerequisites((current) => [createdPrerequisite, ...current]);
              } else if (drawer.prerequisiteId) {
                const updatedPrerequisite = await updatePrerequisite(
                  drawer.prerequisiteId,
                  drawer.flowId,
                  draft,
                );

                setPrerequisites((current) =>
                  current.map((prerequisite) =>
                    prerequisite.id === drawer.prerequisiteId
                      ? updatedPrerequisite
                      : prerequisite,
                  ),
                );
              }

              setDrawer({ type: null });
            } catch (error) {
              console.error("Failed to persist prerequisite", error);
            }
          })();
        }}
        saveLabel={
          drawer.mode === "create" ? "Create prerequisite" : "Save prerequisite"
        }
        onDestructive={
          drawer.mode === "edit" && drawer.prerequisiteId
            ? () => {
                void (async () => {
                  try {
                    const prerequisiteId = drawer.prerequisiteId;

                    if (!prerequisiteId) {
                      return;
                    }

                    await deletePrerequisite(prerequisiteId);

                    setPrerequisites((current) =>
                      current.filter(
                        (prerequisite) => prerequisite.id !== prerequisiteId,
                      ),
                    );
                    setDrawer({ type: null });
                  } catch (error) {
                    console.error("Failed to delete prerequisite", error);
                  }
                })();
              }
            : undefined
        }
        destructiveLabel={
          drawer.mode === "edit" ? "Delete prerequisite" : undefined
        }
      />
    </>
  );
}
