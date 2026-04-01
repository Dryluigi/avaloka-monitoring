use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, OptionalExtension};

use crate::db::connection::open_connection;
use crate::dto::flow::{CreateFlowInput, FlowListItem, UpdateFlowInput};
use crate::errors::{AppError, AppResult};

pub fn list_flows(db_path: &Path) -> AppResult<Vec<FlowListItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            project_id,
            name,
            description,
            enabled,
            interval_seconds,
            status,
            last_run_at,
            next_run_at,
            executable_path,
            args_json,
            working_directory,
            timeout_seconds
        FROM flows
        ORDER BY created_at DESC, name ASC
        "#,
    )?;

    let rows = statement.query_map([], map_flow_list_item)?;
    let mut flows = Vec::new();

    for row in rows {
        flows.push(row?);
    }

    Ok(flows)
}

pub fn create_flow(db_path: &Path, input: CreateFlowInput) -> AppResult<FlowListItem> {
    let connection = open_connection(db_path)?;
    let id = generate_id("flow");
    let args_json = serde_json::to_string(&input.args)
        .map_err(|error| AppError::InvalidState(format!("Could not serialize flow args: {error}")))?;
    let next_run_at = if input.enabled {
        Some(schedule_from_now(&connection, input.interval_seconds)?)
    } else {
        Some("Paused".to_string())
    };

    connection.execute(
        r#"
        INSERT INTO flows (
            id,
            project_id,
            name,
            description,
            enabled,
            interval_seconds,
            executable_path,
            args_json,
            working_directory,
            timeout_seconds,
            next_run_at,
            status
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        "#,
        params![
            id,
            input.project_id,
            input.name.trim(),
            input.description.trim(),
            input.enabled,
            input.interval_seconds,
            input.executable_path.trim(),
            args_json,
            input.working_directory.trim(),
            input.timeout_seconds,
            next_run_at,
            if input.enabled { "success" } else { "disabled" },
        ],
    )?;

    get_flow(db_path, &id)?
        .ok_or_else(|| AppError::InvalidState("Created flow could not be reloaded".into()))
}

pub fn update_flow(db_path: &Path, input: UpdateFlowInput) -> AppResult<FlowListItem> {
    let connection = open_connection(db_path)?;
    let args_json = serde_json::to_string(&input.args)
        .map_err(|error| AppError::InvalidState(format!("Could not serialize flow args: {error}")))?;

    connection.execute(
        r#"
        UPDATE flows
        SET
            project_id = ?2,
            name = ?3,
            description = ?4,
            enabled = ?5,
            interval_seconds = ?6,
            executable_path = ?7,
            args_json = ?8,
            working_directory = ?9,
            timeout_seconds = ?10,
            next_run_at = CASE
                WHEN ?5 = 1 AND last_run_at IS NOT NULL AND last_run_at != ''
                    THEN datetime(last_run_at, '+' || ?6 || ' seconds')
                WHEN ?5 = 1
                    THEN datetime('now', 'localtime', '+' || ?6 || ' seconds')
                WHEN ?5 = 0 THEN 'Paused'
                ELSE next_run_at
            END,
            status = CASE
                WHEN ?5 = 0 THEN 'disabled'
                WHEN status = 'disabled' THEN 'success'
                ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
        params![
            input.id,
            input.project_id,
            input.name.trim(),
            input.description.trim(),
            input.enabled,
            input.interval_seconds,
            input.executable_path.trim(),
            args_json,
            input.working_directory.trim(),
            input.timeout_seconds,
        ],
    )?;

    get_flow(db_path, &input.id)?
        .ok_or_else(|| AppError::InvalidState("Flow was not found for update".into()))
}

pub fn delete_flow(db_path: &Path, id: &str) -> AppResult<()> {
    let connection = open_connection(db_path)?;
    connection.execute("DELETE FROM flows WHERE id = ?1", params![id])?;
    Ok(())
}

fn get_flow(db_path: &Path, id: &str) -> AppResult<Option<FlowListItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
            id,
            project_id,
            name,
            description,
            enabled,
            interval_seconds,
            status,
            last_run_at,
            next_run_at,
            executable_path,
            args_json,
            working_directory,
            timeout_seconds
        FROM flows
        WHERE id = ?1
        "#,
    )?;

    statement
        .query_row(params![id], map_flow_list_item)
        .optional()
        .map_err(Into::into)
}

fn map_flow_list_item(row: &rusqlite::Row<'_>) -> rusqlite::Result<FlowListItem> {
    let interval_seconds: i64 = row.get(5)?;
    let status: String = row.get(6)?;
    let raw_last_run_at: Option<String> = row.get(7)?;
    let raw_next_run_at: Option<String> = row.get(8)?;
    let args_json: String = row.get(10)?;
    let args = serde_json::from_str::<Vec<String>>(&args_json).unwrap_or_default();

    Ok(FlowListItem {
        id: row.get(0)?,
        project_id: row.get(1)?,
        name: row.get(2)?,
        description: row.get(3)?,
        enabled: row.get(4)?,
        interval_seconds,
        interval_label: format_interval_label(interval_seconds),
        status: status.clone(),
        last_run_at: raw_last_run_at.unwrap_or_else(|| "Not yet".into()),
        next_run_at: raw_next_run_at.unwrap_or_else(|| {
            if status == "disabled" {
                "Paused".into()
            } else {
                "Pending schedule".into()
            }
        }),
        executable_path: row.get(9)?,
        args,
        working_directory: row.get(11)?,
        timeout_seconds: row.get(12)?,
        state_count: 0,
    })
}

fn format_interval_label(interval_seconds: i64) -> String {
    if interval_seconds % 3600 == 0 {
        format!("Every {} hr", interval_seconds / 3600)
    } else if interval_seconds % 60 == 0 {
        format!("Every {} min", interval_seconds / 60)
    } else {
        format!("Every {interval_seconds} sec")
    }
}

fn schedule_from_now(connection: &rusqlite::Connection, interval_seconds: i64) -> AppResult<String> {
    connection
        .query_row(
            "SELECT datetime('now', 'localtime', '+' || ?1 || ' seconds')",
            params![interval_seconds],
            |row| row.get(0),
        )
        .map_err(Into::into)
}

fn generate_id(prefix: &str) -> String {
    let micros = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_micros())
        .unwrap_or_default();

    format!("{prefix}-{micros}")
}
