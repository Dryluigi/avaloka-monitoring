use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectVariableInput {
    pub project_id: String,
    pub key: String,
    pub value: String,
    pub is_secret: bool,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectVariableInput {
    pub id: String,
    pub project_id: String,
    pub key: String,
    pub value: String,
    pub is_secret: bool,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteProjectVariableInput {
    pub id: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectVariableItem {
    pub id: String,
    pub project_id: String,
    pub key: String,
    pub value: String,
    pub is_secret: bool,
}
