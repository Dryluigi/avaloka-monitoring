use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AlarmItem {
    pub id: String,
    pub flow_id: String,
    pub flow_name: String,
    pub project_id: String,
    pub project_name: String,
    pub severity: String,
    pub created_at: String,
    pub message: String,
}
