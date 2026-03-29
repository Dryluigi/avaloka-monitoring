use tauri::{AppHandle, Emitter};

use super::types::{
    ActiveExecutionPayload, AlarmCreatedEvent, DueFlow, FlowExecutionFinishedEvent,
    FlowExecutionStartedEvent, PrerequisiteSpec,
};

pub(crate) fn emit_execution_started(
    app_handle: &AppHandle,
    flow: &DueFlow,
    started_at: &str,
    stage: &str,
    note: &str,
) {
    let payload = FlowExecutionStartedEvent {
        execution: ActiveExecutionPayload {
            id: format!("active-{}", flow.id),
            flow_id: flow.id.clone(),
            flow_name: flow.name.clone(),
            project_id: flow.project_id.clone(),
            project_name: flow.project_name.clone(),
            stage: stage.into(),
            started_at: started_at.into(),
            elapsed_label: "0s".into(),
            note: note.into(),
        },
    };

    let _ = app_handle.emit("flow-execution-started", payload);
}

pub(crate) fn emit_execution_finished(app_handle: &AppHandle, flow_id: &str) {
    let payload = FlowExecutionFinishedEvent {
        flow_id: flow_id.into(),
    };

    let _ = app_handle.emit("flow-execution-finished", payload);
}

pub(crate) fn emit_alarm_created(app_handle: &AppHandle, flow_id: &str) {
    let payload = AlarmCreatedEvent {
        flow_id: flow_id.into(),
    };

    let _ = app_handle.emit("alarm-created", payload);
}

pub(crate) fn format_flow_note(flow: &DueFlow) -> String {
    if flow.args.is_empty() {
        flow.executable_path.clone()
    } else {
        format!("{} {}", flow.executable_path, flow.args.join(" "))
    }
}

pub(crate) fn format_prerequisite_note(prerequisite: &PrerequisiteSpec) -> String {
    if prerequisite.args.is_empty() {
        prerequisite.executable_path.clone()
    } else {
        format!(
            "{} {}",
            prerequisite.executable_path,
            prerequisite.args.join(" ")
        )
    }
}
