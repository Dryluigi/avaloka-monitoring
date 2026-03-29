mod events;
mod runtime;
mod store;
mod types;

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use tauri::AppHandle;

use crate::db::connection::open_connection;
use crate::errors::{AppError, AppResult};

use self::events::{
    emit_execution_finished, emit_execution_started, format_flow_note, format_prerequisite_note,
};
use self::runtime::{execute_command, parse_runtime_output_env, upsert_env};
use self::store::{
    current_local_datetime, list_due_flows, list_enabled_prerequisites, load_project_runtime_env,
    pause_disabled_flows, persist_flow_run, register_enabled_flows, update_prerequisite_status,
};
use self::types::DueFlow;

pub fn bootstrap_scheduler(db_path: &Path) -> AppResult<()> {
    let connection = open_connection(db_path)?;

    pause_disabled_flows(&connection)?;
    register_enabled_flows(&connection)?;

    Ok(())
}

pub fn start_scheduler(db_path: PathBuf, app_handle: AppHandle) {
    let active_flows = Arc::new(Mutex::new(HashSet::<String>::new()));

    thread::spawn(move || loop {
        if let Err(error) =
            scan_and_run_due_flows(&db_path, Arc::clone(&active_flows), app_handle.clone())
        {
            eprintln!("Scheduler scan failed: {error}");
        }

        thread::sleep(Duration::from_secs(1));
    });
}

fn scan_and_run_due_flows(
    db_path: &Path,
    active_flows: Arc<Mutex<HashSet<String>>>,
    app_handle: AppHandle,
) -> AppResult<()> {
    let connection = open_connection(db_path)?;
    let due_flows = list_due_flows(&connection)?;

    for due_flow in due_flows {
        let should_start = {
            let mut active = active_flows
                .lock()
                .map_err(|_| AppError::InvalidState("Could not lock active flow registry".into()))?;

            if active.contains(&due_flow.id) {
                false
            } else {
                active.insert(due_flow.id.clone());
                true
            }
        };

        if !should_start {
            continue;
        }

        let db_path = db_path.to_path_buf();
        let active_flows = Arc::clone(&active_flows);
        let app_handle = app_handle.clone();

        thread::spawn(move || {
            let flow_id = due_flow.id.clone();

            if let Err(error) = execute_flow(&db_path, due_flow, app_handle) {
                eprintln!("Flow execution failed for {flow_id}: {error}");
            }

            if let Ok(mut active) = active_flows.lock() {
                active.remove(&flow_id);
            }
        });
    }

    Ok(())
}

fn execute_flow(db_path: &Path, flow: DueFlow, app_handle: AppHandle) -> AppResult<()> {
    let started_at = current_local_datetime(db_path)?;
    let mut runtime_env = load_project_runtime_env(db_path, &flow.project_id)?;
    let prerequisites = list_enabled_prerequisites(db_path, &flow.id)?;

    for prerequisite in prerequisites {
        let prerequisite_started_at = current_local_datetime(db_path)?;
        emit_execution_started(
            &app_handle,
            &flow,
            &prerequisite_started_at,
            "prerequisite",
            &format_prerequisite_note(&prerequisite),
        );

        let result = execute_command(
            &prerequisite.executable_path,
            &prerequisite.args,
            &flow.working_directory,
            flow.timeout_seconds,
            &runtime_env,
            "prerequisite",
        );

        match result {
            Ok(command_result) if command_result.status == "success" => {
                update_prerequisite_status(db_path, &prerequisite.id, "success")?;

                for (key, value) in parse_runtime_output_env(&command_result.stdout_text) {
                    upsert_env(&mut runtime_env, key, value);
                }
            }
            Ok(command_result) => {
                update_prerequisite_status(db_path, &prerequisite.id, "failed")?;
                let finished_at = current_local_datetime(db_path)?;
                let summary = format!("Prerequisite failed: {}", prerequisite.name);
                let failure_message = command_result
                    .failure_message
                    .unwrap_or_else(|| command_result.summary.clone());

                persist_flow_run(
                    db_path,
                    &flow.id,
                    "prerequisite_failed",
                    &started_at,
                    &finished_at,
                    command_result.duration_label.as_str(),
                    &summary,
                    Some(&failure_message),
                    command_result.exit_code,
                    &command_result.stdout_text,
                    &command_result.stderr_text,
                    flow.interval_seconds,
                )?;

                emit_execution_finished(&app_handle, &flow.id);
                return Ok(());
            }
            Err(error) => {
                update_prerequisite_status(db_path, &prerequisite.id, "failed")?;
                let finished_at = current_local_datetime(db_path)?;
                let failure_message = format!(
                    "Prerequisite `{}` could not be launched: {error}",
                    prerequisite.name
                );

                persist_flow_run(
                    db_path,
                    &flow.id,
                    "prerequisite_failed",
                    &started_at,
                    &finished_at,
                    "0s",
                    &format!("Prerequisite failed: {}", prerequisite.name),
                    Some(&failure_message),
                    None,
                    "",
                    &failure_message,
                    flow.interval_seconds,
                )?;

                emit_execution_finished(&app_handle, &flow.id);
                return Ok(());
            }
        }
    }

    let main_started_at = current_local_datetime(db_path)?;
    emit_execution_started(
        &app_handle,
        &flow,
        &main_started_at,
        "main",
        &format_flow_note(&flow),
    );

    let result = match execute_command(
        &flow.executable_path,
        &flow.args,
        &flow.working_directory,
        flow.timeout_seconds,
        &runtime_env,
        "main",
    ) {
        Ok(result) => result,
        Err(error) => {
            let finished_at = current_local_datetime(db_path)?;
            let message = format!(
                "Could not launch flow command `{}`: {error}",
                flow.executable_path
            );

            persist_flow_run(
                db_path,
                &flow.id,
                "failed",
                &started_at,
                &finished_at,
                "0s",
                "Flow launch failed",
                Some(&message),
                None,
                "",
                &message,
                flow.interval_seconds,
            )?;

            emit_execution_finished(&app_handle, &flow.id);
            return Ok(());
        }
    };
    let finished_at = current_local_datetime(db_path)?;

    persist_flow_run(
        db_path,
        &flow.id,
        &result.status,
        &started_at,
        &finished_at,
        &result.duration_label,
        &result.summary,
        result.failure_message.as_deref(),
        result.exit_code,
        &result.stdout_text,
        &result.stderr_text,
        flow.interval_seconds,
    )?;

    emit_execution_finished(&app_handle, &flow.id);

    Ok(())
}
