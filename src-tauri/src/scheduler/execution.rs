use std::path::Path;

use tauri::AppHandle;

use crate::errors::AppResult;

use super::events::{
    emit_execution_finished, emit_execution_started, format_flow_note,
    format_prerequisite_note,
};
use super::notify::create_alarm_record;
use super::runtime::{
    execute_command, parse_persisted_state_output, parse_runtime_output_env, upsert_env,
};
use super::store::{
    current_local_datetime, list_enabled_prerequisites, load_flow_state_env,
    load_project_runtime_env, persist_flow_run, update_prerequisite_status,
    upsert_flow_state_entries,
};
use super::types::DueFlow;

pub(crate) fn execute_flow(db_path: &Path, flow: DueFlow, app_handle: AppHandle) -> AppResult<()> {
    let started_at = current_local_datetime(db_path)?;
    let mut runtime_env = load_flow_state_env(db_path, &flow.id)?;
    for (key, value) in load_project_runtime_env(db_path, &flow.project_id)? {
        upsert_env(&mut runtime_env, key, value);
    }
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

                let persisted_state = parse_persisted_state_output(&command_result.stdout_text);
                if let Err(error) = upsert_flow_state_entries(db_path, &flow.id, &persisted_state)
                {
                    eprintln!(
                        "Failed to persist flow state from prerequisite {} on flow {}: {error}",
                        prerequisite.id, flow.id
                    );
                }
            }
            Ok(command_result) => {
                update_prerequisite_status(db_path, &prerequisite.id, "failed")?;
                let finished_at = current_local_datetime(db_path)?;
                let summary = format!("Prerequisite failed: {}", prerequisite.name);
                let raw_failure_message = command_result
                    .failure_message
                    .unwrap_or_else(|| command_result.summary.clone());
                let failure_message = format!(
                    "Prerequisite '{}' failed: {}",
                    prerequisite.name, raw_failure_message
                );

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
                create_alarm_record(
                    db_path,
                    &app_handle,
                    &flow,
                    &finished_at,
                    &failure_message,
                )?;

                emit_execution_finished(&app_handle, &flow.id);
                return Ok(());
            }
            Err(error) => {
                update_prerequisite_status(db_path, &prerequisite.id, "failed")?;
                let finished_at = current_local_datetime(db_path)?;
                let failure_message = format!(
                    "Prerequisite '{}' could not be launched: {error}",
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
                create_alarm_record(
                    db_path,
                    &app_handle,
                    &flow,
                    &finished_at,
                    &failure_message,
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
            create_alarm_record(db_path, &app_handle, &flow, &finished_at, &message)?;

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

    if result.status == "success" {
        let persisted_state = parse_persisted_state_output(&result.stdout_text);
        if let Err(error) = upsert_flow_state_entries(db_path, &flow.id, &persisted_state) {
            eprintln!("Failed to persist flow state from flow {}: {error}", flow.id);
        }
    }

    if result.status != "success" {
        let alarm_message = result
            .failure_message
            .clone()
            .unwrap_or_else(|| result.summary.clone());
        create_alarm_record(db_path, &app_handle, &flow, &finished_at, &alarm_message)?;
    }

    emit_execution_finished(&app_handle, &flow.id);

    Ok(())
}
