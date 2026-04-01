use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFlowInput {
    pub project_id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub interval_seconds: i64,
    pub executable_path: String,
    pub args: Vec<String>,
    pub working_directory: String,
    pub timeout_seconds: i64,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFlowInput {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub interval_seconds: i64,
    pub executable_path: String,
    pub args: Vec<String>,
    pub working_directory: String,
    pub timeout_seconds: i64,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFlowInput {
    pub id: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowListItem {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub interval_seconds: i64,
    pub interval_label: String,
    pub status: String,
    pub last_run_at: String,
    pub next_run_at: String,
    pub executable_path: String,
    pub args: Vec<String>,
    pub working_directory: String,
    pub timeout_seconds: i64,
    pub state_count: i64,
}
