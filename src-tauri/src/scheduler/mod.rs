use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::db::connection::open_connection;
use crate::errors::{AppError, AppResult};

#[derive(Clone, Debug)]
struct DueFlow {
    id: String,
    project_id: String,
    project_name: String,
    name: String,
    interval_seconds: i64,
    executable_path: String,
    args: Vec<String>,
    working_directory: String,
    timeout_seconds: i64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ActiveExecutionPayload {
    id: String,
    flow_id: String,
    flow_name: String,
    project_id: String,
    project_name: String,
    stage: String,
    started_at: String,
    elapsed_label: String,
    note: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FlowExecutionStartedEvent {
    execution: ActiveExecutionPayload,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FlowExecutionFinishedEvent {
    flow_id: String,
}

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
    let started_instant = Instant::now();
    let runtime_env = load_project_runtime_env(db_path, &flow.project_id)?;
    emit_execution_started(&app_handle, &flow, &started_at);

    let mut command = Command::new(&flow.executable_path);
    command
        .args(&flow.args)
        .current_dir(if flow.working_directory.is_empty() {
            "."
        } else {
            flow.working_directory.as_str()
        })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    for (key, value) in &runtime_env {
        command.env(key, value);
    }

    let mut child = match command.spawn() {
        Ok(child) => child,
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

    let mut timed_out = false;

    loop {
        if started_instant.elapsed() >= Duration::from_secs(flow.timeout_seconds.max(1) as u64) {
            timed_out = true;
            let _ = child.kill();
            break;
        }

        match child.try_wait()? {
            Some(_) => break,
            None => thread::sleep(Duration::from_millis(200)),
        }
    }

    let output = child.wait_with_output()?;
    let finished_at = current_local_datetime(db_path)?;
    let duration_label = format_duration_label(started_instant.elapsed());
    let stdout_text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr_text = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let exit_code = output.status.code().map(i64::from);

    let (status, summary, failure_message) = if timed_out {
        (
            "timed_out".to_string(),
            "Flow execution timed out".to_string(),
            Some(format!(
                "Process exceeded {} seconds and was terminated.",
                flow.timeout_seconds
            )),
        )
    } else if output.status.success() {
        (
            "success".to_string(),
            summarize_success(&stdout_text),
            None,
        )
    } else {
        (
            "failed".to_string(),
            summarize_failure(&stderr_text, &stdout_text, exit_code),
            Some(summarize_failure(&stderr_text, &stdout_text, exit_code)),
        )
    };

    persist_flow_run(
        db_path,
        &flow.id,
        &status,
        &started_at,
        &finished_at,
        &duration_label,
        &summary,
        failure_message.as_deref(),
        exit_code,
        &stdout_text,
        &stderr_text,
        flow.interval_seconds,
    )?;

    emit_execution_finished(&app_handle, &flow.id);

    Ok(())
}

fn list_due_flows(connection: &Connection) -> AppResult<Vec<DueFlow>> {
    let mut statement = connection.prepare(
        r#"
        SELECT
            f.id,
            f.project_id,
            p.name,
            f.name,
            f.interval_seconds,
            f.executable_path,
            f.args_json,
            f.working_directory,
            f.timeout_seconds
        FROM flows f
        JOIN projects p ON p.id = f.project_id
        WHERE f.enabled = 1
          AND f.next_run_at IS NOT NULL
          AND f.next_run_at NOT IN ('Paused', 'Pending schedule')
          AND datetime(f.next_run_at) <= datetime('now', 'localtime')
        ORDER BY datetime(f.next_run_at) ASC
        "#,
    )?;

    let rows = statement.query_map([], |row| {
        let args_json: String = row.get(6)?;
        let args = serde_json::from_str::<Vec<String>>(&args_json).unwrap_or_default();

        Ok(DueFlow {
            id: row.get(0)?,
            project_id: row.get(1)?,
            project_name: row.get(2)?,
            name: row.get(3)?,
            interval_seconds: row.get(4)?,
            executable_path: row.get(5)?,
            args,
            working_directory: row.get(7)?,
            timeout_seconds: row.get(8)?,
        })
    })?;

    let mut flows = Vec::new();
    for row in rows {
        flows.push(row?);
    }

    Ok(flows)
}

fn load_project_runtime_env(db_path: &Path, project_id: &str) -> AppResult<Vec<(String, String)>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT key, value
        FROM project_variables
        WHERE project_id = ?1
        ORDER BY created_at ASC, key ASC
        "#,
    )?;

    let rows = statement.query_map(params![project_id], |row| {
        let key: String = row.get(0)?;
        let value: String = row.get(1)?;
        Ok((key, value))
    })?;

    let mut env_vars = Vec::new();

    for row in rows {
        let (key, value) = row?;

        if is_valid_env_key(&key) {
            env_vars.push((key, value));
        }
    }

    Ok(env_vars)
}

fn is_valid_env_key(key: &str) -> bool {
    let mut chars = key.chars();
    let Some(first) = chars.next() else {
        return false;
    };

    if !(first == '_' || first.is_ascii_alphabetic()) {
        return false;
    }

    chars.all(|char| char == '_' || char.is_ascii_alphanumeric())
}

fn emit_execution_started(app_handle: &AppHandle, flow: &DueFlow, started_at: &str) {
    let note = if flow.args.is_empty() {
        flow.executable_path.clone()
    } else {
        format!("{} {}", flow.executable_path, flow.args.join(" "))
    };

    let payload = FlowExecutionStartedEvent {
        execution: ActiveExecutionPayload {
            id: format!("active-{}", flow.id),
            flow_id: flow.id.clone(),
            flow_name: flow.name.clone(),
            project_id: flow.project_id.clone(),
            project_name: flow.project_name.clone(),
            stage: "main".into(),
            started_at: started_at.into(),
            elapsed_label: "0s".into(),
            note,
        },
    };

    let _ = app_handle.emit("flow-execution-started", payload);
}

fn emit_execution_finished(app_handle: &AppHandle, flow_id: &str) {
    let payload = FlowExecutionFinishedEvent {
        flow_id: flow_id.into(),
    };

    let _ = app_handle.emit("flow-execution-finished", payload);
}

fn persist_flow_run(
    db_path: &Path,
    flow_id: &str,
    status: &str,
    started_at: &str,
    finished_at: &str,
    duration_label: &str,
    summary: &str,
    failure_message: Option<&str>,
    exit_code: Option<i64>,
    stdout_text: &str,
    stderr_text: &str,
    interval_seconds: i64,
) -> AppResult<()> {
    let connection = open_connection(db_path)?;
    let run_id = generate_id("run");
    let next_run_at: String = connection.query_row(
        "SELECT datetime(?1, '+' || ?2 || ' seconds')",
        params![finished_at, interval_seconds],
        |row| row.get(0),
    )?;

    connection.execute(
        r#"
        INSERT INTO flow_runs (
            id,
            flow_id,
            status,
            started_at,
            finished_at,
            duration_label,
            summary,
            failure_message,
            exit_code,
            stdout_text,
            stderr_text
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        "#,
        params![
            run_id,
            flow_id,
            status,
            started_at,
            finished_at,
            duration_label,
            summary,
            failure_message,
            exit_code,
            truncate_text(stdout_text),
            truncate_text(stderr_text),
        ],
    )?;

    connection.execute(
        r#"
        UPDATE flows
        SET
            status = ?2,
            last_run_at = ?3,
            next_run_at = ?4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
        params![flow_id, status, finished_at, next_run_at],
    )?;

    Ok(())
}

fn pause_disabled_flows(connection: &Connection) -> AppResult<()> {
    connection.execute(
        r#"
        UPDATE flows
        SET
            next_run_at = 'Paused',
            status = 'disabled',
            updated_at = CURRENT_TIMESTAMP
        WHERE enabled = 0
        "#,
        [],
    )?;

    Ok(())
}

fn register_enabled_flows(connection: &Connection) -> AppResult<()> {
    connection.execute(
        r#"
        UPDATE flows
        SET
            next_run_at = CASE
                WHEN last_run_at IS NOT NULL AND last_run_at != ''
                    THEN datetime(last_run_at, '+' || interval_seconds || ' seconds')
                ELSE datetime('now', 'localtime', '+' || interval_seconds || ' seconds')
            END,
            status = CASE
                WHEN status = 'disabled' THEN 'success'
                ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE enabled = 1
          AND (next_run_at IS NULL OR next_run_at = '' OR next_run_at = 'Paused' OR next_run_at = 'Pending schedule')
        "#,
        [],
    )?;

    Ok(())
}

fn current_local_datetime(db_path: &Path) -> AppResult<String> {
    let connection = open_connection(db_path)?;
    connection
        .query_row("SELECT datetime('now', 'localtime')", [], |row| row.get(0))
        .map_err(Into::into)
}

fn format_duration_label(duration: Duration) -> String {
    let seconds = duration.as_secs();

    if seconds >= 60 {
        let minutes = seconds / 60;
        let remainder = seconds % 60;

        if remainder == 0 {
            format!("{minutes}m")
        } else {
            format!("{minutes}m {remainder}s")
        }
    } else {
        format!("{seconds}s")
    }
}

fn summarize_success(stdout_text: &str) -> String {
    if stdout_text.is_empty() {
        "Flow completed successfully".into()
    } else {
        truncate_text(stdout_text)
    }
}

fn summarize_failure(stderr_text: &str, stdout_text: &str, exit_code: Option<i64>) -> String {
    if !stderr_text.is_empty() {
        truncate_text(stderr_text)
    } else if !stdout_text.is_empty() {
        truncate_text(stdout_text)
    } else if let Some(code) = exit_code {
        format!("Process exited with code {code}")
    } else {
        "Flow execution failed".into()
    }
}

fn truncate_text(value: &str) -> String {
    let trimmed = value.trim();
    const LIMIT: usize = 280;

    if trimmed.chars().count() <= LIMIT {
        trimmed.to_string()
    } else {
        let shortened: String = trimmed.chars().take(LIMIT).collect();
        format!("{shortened}...")
    }
}

fn generate_id(prefix: &str) -> String {
    let micros = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_micros())
        .unwrap_or_default();

    format!("{prefix}-{micros}")
}
