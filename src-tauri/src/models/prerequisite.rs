use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Prerequisite {
    pub id: String,
    pub flow_id: String,
    pub name: String,
    pub executable_path: String,
    pub args_json: String,
    pub order_index: i64,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}
