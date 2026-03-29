use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};

use crate::db::connection::open_connection;
use crate::errors::AppResult;

use super::runtime::is_valid_env_key;
use super::types::{DueFlow, PrerequisiteSpec};

pub(crate) fn list_due_flows(connection: &Connection) -> AppResult<Vec<DueFlow>> {
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

pub(crate) fn load_project_runtime_env(
    db_path: &Path,
    project_id: &str,
) -> AppResult<Vec<(String, String)>> {
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

pub(crate) fn load_flow_state_env(
    db_path: &Path,
    flow_id: &str,
) -> AppResult<Vec<(String, String)>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT key, value
        FROM flow_state
        WHERE flow_id = ?1
        ORDER BY updated_at ASC, key ASC
        "#,
    )?;

    let rows = statement.query_map(params![flow_id], |row| {
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

pub(crate) fn list_enabled_prerequisites(
    db_path: &Path,
    flow_id: &str,
) -> AppResult<Vec<PrerequisiteSpec>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT id, name, executable_path, args_json
        FROM prerequisites
        WHERE flow_id = ?1
          AND enabled = 1
        ORDER BY order_index ASC, created_at ASC
        "#,
    )?;

    let rows = statement.query_map(params![flow_id], |row| {
        let args_json: String = row.get(3)?;
        let args = serde_json::from_str::<Vec<String>>(&args_json).unwrap_or_default();

        Ok(PrerequisiteSpec {
            id: row.get(0)?,
            name: row.get(1)?,
            executable_path: row.get(2)?,
            args,
        })
    })?;

    let mut prerequisites = Vec::new();
    for row in rows {
        prerequisites.push(row?);
    }

    Ok(prerequisites)
}

pub(crate) fn update_prerequisite_status(
    db_path: &Path,
    prerequisite_id: &str,
    status: &str,
) -> AppResult<()> {
    let connection = open_connection(db_path)?;
    connection.execute(
        r#"
        UPDATE prerequisites
        SET status = ?2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
        params![prerequisite_id, status],
    )?;

    Ok(())
}

pub(crate) fn persist_flow_run(
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

pub(crate) fn persist_alarm(
    db_path: &Path,
    flow_id: &str,
    severity: &str,
    created_at: &str,
    message: &str,
) -> AppResult<()> {
    let connection = open_connection(db_path)?;
    let alarm_id = generate_id("alarm");

    connection.execute(
        r#"
        INSERT INTO alarms (id, flow_id, severity, created_at, message)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        params![alarm_id, flow_id, severity, created_at, truncate_text(message)],
    )?;

    Ok(())
}

pub(crate) fn upsert_flow_state_entries(
    db_path: &Path,
    flow_id: &str,
    entries: &[(String, String)],
) -> AppResult<()> {
    if entries.is_empty() {
        return Ok(());
    }

    let connection = open_connection(db_path)?;
    let now: String =
        connection.query_row("SELECT datetime('now', 'localtime')", [], |row| row.get(0))?;

    let mut statement = connection.prepare(
        r#"
        INSERT INTO flow_state (id, flow_id, key, value, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(flow_id, key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        "#,
    )?;

    for (key, value) in entries {
        statement.execute(params![
            generate_id("state"),
            flow_id,
            key,
            truncate_text(value),
            now,
        ])?;
    }

    Ok(())
}

pub(crate) fn pause_disabled_flows(connection: &Connection) -> AppResult<()> {
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

pub(crate) fn register_enabled_flows(connection: &Connection) -> AppResult<()> {
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

pub(crate) fn current_local_datetime(db_path: &Path) -> AppResult<String> {
    let connection = open_connection(db_path)?;
    connection
        .query_row("SELECT datetime('now', 'localtime')", [], |row| row.get(0))
        .map_err(Into::into)
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
