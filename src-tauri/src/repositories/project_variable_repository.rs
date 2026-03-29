use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, OptionalExtension};

use crate::db::connection::open_connection;
use crate::dto::project_variable::{
    CreateProjectVariableInput, ProjectVariableItem, UpdateProjectVariableInput,
};
use crate::errors::{AppError, AppResult};

pub fn list_project_variables(db_path: &Path) -> AppResult<Vec<ProjectVariableItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT id, project_id, key, value, is_secret
        FROM project_variables
        ORDER BY created_at DESC, key ASC
        "#,
    )?;

    let rows = statement.query_map([], map_project_variable_item)?;
    let mut variables = Vec::new();

    for row in rows {
        variables.push(row?);
    }

    Ok(variables)
}

pub fn create_project_variable(
    db_path: &Path,
    input: CreateProjectVariableInput,
) -> AppResult<ProjectVariableItem> {
    let connection = open_connection(db_path)?;
    let id = generate_id("var");

    connection.execute(
        r#"
        INSERT INTO project_variables (id, project_id, key, value, is_secret)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        params![
            id,
            input.project_id,
            input.key.trim(),
            input.value,
            input.is_secret
        ],
    )?;

    get_project_variable(db_path, &id)?.ok_or_else(|| {
        AppError::InvalidState("Created project variable could not be reloaded".into())
    })
}

pub fn update_project_variable(
    db_path: &Path,
    input: UpdateProjectVariableInput,
) -> AppResult<ProjectVariableItem> {
    let connection = open_connection(db_path)?;

    connection.execute(
        r#"
        UPDATE project_variables
        SET
            project_id = ?2,
            key = ?3,
            value = ?4,
            is_secret = ?5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
        params![
            input.id,
            input.project_id,
            input.key.trim(),
            input.value,
            input.is_secret
        ],
    )?;

    get_project_variable(db_path, &input.id)?
        .ok_or_else(|| AppError::InvalidState("Project variable was not found for update".into()))
}

pub fn delete_project_variable(db_path: &Path, id: &str) -> AppResult<()> {
    let connection = open_connection(db_path)?;
    connection.execute("DELETE FROM project_variables WHERE id = ?1", params![id])?;
    Ok(())
}

fn get_project_variable(db_path: &Path, id: &str) -> AppResult<Option<ProjectVariableItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT id, project_id, key, value, is_secret
        FROM project_variables
        WHERE id = ?1
        "#,
    )?;

    statement
        .query_row(params![id], map_project_variable_item)
        .optional()
        .map_err(Into::into)
}

fn map_project_variable_item(row: &rusqlite::Row<'_>) -> rusqlite::Result<ProjectVariableItem> {
    let is_secret: bool = row.get(4)?;
    let value: String = row.get(3)?;

    Ok(ProjectVariableItem {
        id: row.get(0)?,
        project_id: row.get(1)?,
        key: row.get(2)?,
        value: if is_secret { "••••••••••••".into() } else { value },
        is_secret,
    })
}

fn generate_id(prefix: &str) -> String {
    let micros = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_micros())
        .unwrap_or_default();

    format!("{prefix}-{micros}")
}
