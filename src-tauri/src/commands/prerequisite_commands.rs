use tauri::State;

use crate::dto::prerequisite::{
    CreatePrerequisiteInput, DeletePrerequisiteInput, PrerequisiteItem, UpdatePrerequisiteInput,
};
use crate::repositories::prerequisite_repository;
use crate::state::AppState;

#[tauri::command]
pub fn list_prerequisites(
    state: State<'_, AppState>,
) -> Result<Vec<PrerequisiteItem>, String> {
    prerequisite_repository::list_prerequisites(&state.db_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_prerequisite(
    state: State<'_, AppState>,
    input: CreatePrerequisiteInput,
) -> Result<PrerequisiteItem, String> {
    prerequisite_repository::create_prerequisite(&state.db_path, input)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn update_prerequisite(
    state: State<'_, AppState>,
    input: UpdatePrerequisiteInput,
) -> Result<PrerequisiteItem, String> {
    prerequisite_repository::update_prerequisite(&state.db_path, input)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_prerequisite(
    state: State<'_, AppState>,
    input: DeletePrerequisiteInput,
) -> Result<(), String> {
    prerequisite_repository::delete_prerequisite(&state.db_path, &input.id)
        .map_err(|error| error.to_string())
}
