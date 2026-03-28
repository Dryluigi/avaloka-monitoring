use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectVariable {
    pub id: String,
    pub project_id: String,
    pub key: String,
    pub value: String,
    pub is_secret: bool,
    pub created_at: String,
    pub updated_at: String,
}
