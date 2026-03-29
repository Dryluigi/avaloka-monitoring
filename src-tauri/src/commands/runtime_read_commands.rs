use tauri::State;

use crate::dto::alarm::AlarmItem;
use crate::dto::flow_run::FlowRunItem;
use crate::dto::flow_state::FlowStateItem;
use crate::repositories::{alarm_repository, flow_run_repository, flow_state_repository};
use crate::state::AppState;

#[tauri::command]
pub fn list_flow_runs(state: State<'_, AppState>) -> Result<Vec<FlowRunItem>, String> {
    flow_run_repository::list_flow_runs(&state.db_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn list_alarms(state: State<'_, AppState>) -> Result<Vec<AlarmItem>, String> {
    alarm_repository::list_alarms(&state.db_path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn list_flow_state(state: State<'_, AppState>) -> Result<Vec<FlowStateItem>, String> {
    flow_state_repository::list_flow_state(&state.db_path).map_err(|error| error.to_string())
}
