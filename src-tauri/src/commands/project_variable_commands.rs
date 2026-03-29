use tauri::State;

use crate::dto::project_variable::{
    CreateProjectVariableInput, DeleteProjectVariableInput, ProjectVariableItem,
    UpdateProjectVariableInput,
};
use crate::repositories::project_variable_repository;
use crate::state::AppState;

#[tauri::command]
pub fn list_project_variables(
    state: State<'_, AppState>,
) -> Result<Vec<ProjectVariableItem>, String> {
    project_variable_repository::list_project_variables(&state.db_path)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_project_variable(
    state: State<'_, AppState>,
    input: CreateProjectVariableInput,
) -> Result<ProjectVariableItem, String> {
    project_variable_repository::create_project_variable(&state.db_path, input)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn update_project_variable(
    state: State<'_, AppState>,
    input: UpdateProjectVariableInput,
) -> Result<ProjectVariableItem, String> {
    project_variable_repository::update_project_variable(&state.db_path, input)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_project_variable(
    state: State<'_, AppState>,
    input: DeleteProjectVariableInput,
) -> Result<(), String> {
    project_variable_repository::delete_project_variable(&state.db_path, &input.id)
        .map_err(|error| error.to_string())
}
