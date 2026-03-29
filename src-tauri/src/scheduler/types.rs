use serde::Serialize;

#[derive(Clone, Debug)]
pub(crate) struct DueFlow {
    pub id: String,
    pub project_id: String,
    pub project_name: String,
    pub name: String,
    pub interval_seconds: i64,
    pub executable_path: String,
    pub args: Vec<String>,
    pub working_directory: String,
    pub timeout_seconds: i64,
}

#[derive(Clone, Debug)]
pub(crate) struct PrerequisiteSpec {
    pub id: String,
    pub name: String,
    pub executable_path: String,
    pub args: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ActiveExecutionPayload {
    pub id: String,
    pub flow_id: String,
    pub flow_name: String,
    pub project_id: String,
    pub project_name: String,
    pub stage: String,
    pub started_at: String,
    pub elapsed_label: String,
    pub note: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FlowExecutionStartedEvent {
    pub execution: ActiveExecutionPayload,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FlowExecutionFinishedEvent {
    pub flow_id: String,
}

pub(crate) struct CommandRunResult {
    pub status: String,
    pub summary: String,
    pub failure_message: Option<String>,
    pub exit_code: Option<i64>,
    pub stdout_text: String,
    pub stderr_text: String,
    pub duration_label: String,
}
