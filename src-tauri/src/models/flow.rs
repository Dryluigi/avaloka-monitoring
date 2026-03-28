use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Flow {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub enabled: bool,
    pub interval_seconds: i64,
    pub executable_path: String,
    pub args_json: String,
    pub working_directory: String,
    pub timeout_seconds: i64,
    pub last_run_at: Option<String>,
    pub next_run_at: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}
