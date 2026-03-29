use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, OptionalExtension};

use crate::db::connection::open_connection;
use crate::dto::prerequisite::{CreatePrerequisiteInput, PrerequisiteItem, UpdatePrerequisiteInput};
use crate::errors::{AppError, AppResult};

pub fn list_prerequisites(db_path: &Path) -> AppResult<Vec<PrerequisiteItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT id, flow_id, name, executable_path, args_json, status
             , enabled
        FROM prerequisites
        ORDER BY order_index ASC, created_at DESC
        "#,
    )?;

    let rows = statement.query_map([], map_prerequisite_item)?;
    let mut prerequisites = Vec::new();

    for row in rows {
        prerequisites.push(row?);
    }

    Ok(prerequisites)
}

pub fn create_prerequisite(
    db_path: &Path,
    input: CreatePrerequisiteInput,
) -> AppResult<PrerequisiteItem> {
    let connection = open_connection(db_path)?;
    let id = generate_id("pre");
    let args_json = serde_json::to_string(&input.args)
        .map_err(|error| AppError::InvalidState(format!("Could not serialize prerequisite args: {error}")))?;
    let order_index: i64 = connection.query_row(
        "SELECT COALESCE(MAX(order_index), -1) + 1 FROM prerequisites WHERE flow_id = ?1",
        params![input.flow_id],
        |row| row.get(0),
    )?;

    connection.execute(
        r#"
        INSERT INTO prerequisites (
            id, flow_id, name, executable_path, args_json, order_index, enabled, status
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![
            id,
            input.flow_id,
            input.name.trim(),
            input.executable_path.trim(),
            args_json,
            order_index,
            input.enabled,
            input.status
        ],
    )?;

    get_prerequisite(db_path, &id)?
        .ok_or_else(|| AppError::InvalidState("Created prerequisite could not be reloaded".into()))
}

pub fn update_prerequisite(
    db_path: &Path,
    input: UpdatePrerequisiteInput,
) -> AppResult<PrerequisiteItem> {
    let connection = open_connection(db_path)?;
    let args_json = serde_json::to_string(&input.args)
        .map_err(|error| AppError::InvalidState(format!("Could not serialize prerequisite args: {error}")))?;

    connection.execute(
        r#"
        UPDATE prerequisites
        SET
            flow_id = ?2,
            name = ?3,
            executable_path = ?4,
            args_json = ?5,
            enabled = ?6,
            status = ?7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
        params![
            input.id,
            input.flow_id,
            input.name.trim(),
            input.executable_path.trim(),
            args_json,
            input.enabled,
            input.status
        ],
    )?;

    get_prerequisite(db_path, &input.id)?
        .ok_or_else(|| AppError::InvalidState("Prerequisite was not found for update".into()))
}

pub fn delete_prerequisite(db_path: &Path, id: &str) -> AppResult<()> {
    let connection = open_connection(db_path)?;
    connection.execute("DELETE FROM prerequisites WHERE id = ?1", params![id])?;
    Ok(())
}

fn get_prerequisite(db_path: &Path, id: &str) -> AppResult<Option<PrerequisiteItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT id, flow_id, name, executable_path, args_json, status, enabled
        FROM prerequisites
        WHERE id = ?1
        "#,
    )?;

    statement
        .query_row(params![id], map_prerequisite_item)
        .optional()
        .map_err(Into::into)
}

fn map_prerequisite_item(row: &rusqlite::Row<'_>) -> rusqlite::Result<PrerequisiteItem> {
    let args_json: String = row.get(4)?;
    let args = serde_json::from_str::<Vec<String>>(&args_json).unwrap_or_default();

    Ok(PrerequisiteItem {
        id: row.get(0)?,
        flow_id: row.get(1)?,
        name: row.get(2)?,
        executable_path: row.get(3)?,
        args,
        status: row.get(5)?,
        enabled: row.get(6)?,
    })
}

fn generate_id(prefix: &str) -> String {
    let micros = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_micros())
        .unwrap_or_default();

    format!("{prefix}-{micros}")
}
