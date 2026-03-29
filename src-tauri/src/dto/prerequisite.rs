use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePrerequisiteInput {
    pub flow_id: String,
    pub name: String,
    pub executable_path: String,
    pub args: Vec<String>,
    pub enabled: bool,
    pub status: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePrerequisiteInput {
    pub id: String,
    pub flow_id: String,
    pub name: String,
    pub executable_path: String,
    pub args: Vec<String>,
    pub enabled: bool,
    pub status: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeletePrerequisiteInput {
    pub id: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrerequisiteItem {
    pub id: String,
    pub flow_id: String,
    pub name: String,
    pub executable_path: String,
    pub args: Vec<String>,
    pub enabled: bool,
    pub status: String,
}
