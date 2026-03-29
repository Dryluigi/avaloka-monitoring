use tauri::State;

use crate::dto::flow::{CreateFlowInput, DeleteFlowInput, FlowListItem, UpdateFlowInput};
use crate::repositories::flow_repository;
use crate::state::AppState;

#[tauri::command]
pub fn list_flows(state: State<'_, AppState>) -> Result<Vec<FlowListItem>, String> {
    flow_repository::list_flows(&state.db_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_flow(
    state: State<'_, AppState>,
    input: CreateFlowInput,
) -> Result<FlowListItem, String> {
    flow_repository::create_flow(&state.db_path, input).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn update_flow(
    state: State<'_, AppState>,
    input: UpdateFlowInput,
) -> Result<FlowListItem, String> {
    flow_repository::update_flow(&state.db_path, input).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_flow(
    state: State<'_, AppState>,
    input: DeleteFlowInput,
) -> Result<(), String> {
    flow_repository::delete_flow(&state.db_path, &input.id).map_err(|error| error.to_string())
}
