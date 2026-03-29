use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowStateItem {
    pub id: String,
    pub flow_id: String,
    pub key: String,
    pub value: String,
    pub updated_at: String,
}
