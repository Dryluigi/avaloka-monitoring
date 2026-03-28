use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Alarm {
    pub id: String,
    pub flow_id: String,
    pub severity: String,
    pub created_at: String,
    pub message: String,
}
