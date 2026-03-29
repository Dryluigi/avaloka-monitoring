import { getDrawerTitle } from "../lib/config";
import { useAppState } from "../state/AppStateContext";
import { DrawerShell } from "./drawer/DrawerShell";
import { FlowDrawerForm } from "./drawer/FlowDrawerForm";
import { PrerequisiteDrawerForm } from "./drawer/PrerequisiteDrawerForm";
import { ProjectDrawerForm } from "./drawer/ProjectDrawerForm";
import { VariableDrawerForm } from "./drawer/VariableDrawerForm";

export function Drawer() {
  const { drawer, setDrawer } = useAppState();

  if (drawer.type === null) {
    return null;
  }

  return (
    <DrawerShell
      title={getDrawerTitle(drawer)}
      onClose={() => setDrawer({ type: null })}
    >
      {drawer.type === "project" ? <ProjectDrawerForm /> : null}
      {drawer.type === "flow" ? <FlowDrawerForm /> : null}
      {drawer.type === "variable" ? <VariableDrawerForm /> : null}
      {drawer.type === "prerequisite" ? <PrerequisiteDrawerForm /> : null}
    </DrawerShell>
  );
}
