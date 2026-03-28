use tauri::State;

use crate::dto::project::{
    CreateProjectInput, DeleteProjectInput, ProjectListItem, UpdateProjectInput,
};
use crate::repositories::project_repository;
use crate::state::AppState;

#[tauri::command]
pub fn list_projects(state: State<'_, AppState>) -> Result<Vec<ProjectListItem>, String> {
    project_repository::list_projects(&state.db_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_project(
    state: State<'_, AppState>,
    input: CreateProjectInput,
) -> Result<ProjectListItem, String> {
    project_repository::create_project(&state.db_path, input).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn update_project(
    state: State<'_, AppState>,
    input: UpdateProjectInput,
) -> Result<ProjectListItem, String> {
    project_repository::update_project(&state.db_path, input).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_project(state: State<'_, AppState>, input: DeleteProjectInput) -> Result<(), String> {
    project_repository::delete_project(&state.db_path, &input.id).map_err(|error| error.to_string())
}
