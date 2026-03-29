use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowRun {
    pub id: String,
    pub flow_id: String,
    pub status: String,
    pub started_at: String,
    pub finished_at: String,
    pub duration_label: String,
    pub summary: String,
    pub failure_message: Option<String>,
    pub exit_code: Option<i64>,
    pub stdout_text: String,
    pub stderr_text: String,
    pub created_at: String,
}
