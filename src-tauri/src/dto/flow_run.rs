use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowRunItem {
    pub id: String,
    pub flow_id: String,
    pub flow_name: String,
    pub project_id: String,
    pub project_name: String,
    pub status: String,
    pub started_at: String,
    pub finished_at: String,
    pub duration_label: String,
    pub summary: String,
    pub failure_message: Option<String>,
}
