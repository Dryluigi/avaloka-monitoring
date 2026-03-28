use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowState {
    pub id: String,
    pub flow_id: String,
    pub key: String,
    pub value: String,
    pub updated_at: String,
}
