use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, OptionalExtension};

use crate::db::connection::open_connection;
use crate::dto::project::{CreateProjectInput, ProjectListItem, UpdateProjectInput};
use crate::errors::{AppError, AppResult};

pub fn list_projects(db_path: &Path) -> AppResult<Vec<ProjectListItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
            p.id,
            p.name,
            p.description,
            p.enabled,
            (
                SELECT COUNT(*)
                FROM project_variables v
                WHERE v.project_id = p.id AND v.is_secret = 0
            ) AS variable_count,
            (
                SELECT COUNT(*)
                FROM project_variables v
                WHERE v.project_id = p.id AND v.is_secret = 1
            ) AS secret_count,
            (
                SELECT COUNT(*)
                FROM flows f
                WHERE f.project_id = p.id
            ) AS flow_count
        FROM projects p
        ORDER BY p.created_at DESC, p.name ASC
        "#,
    )?;

    let rows = statement.query_map([], map_project_list_item)?;
    let mut projects = Vec::new();

    for row in rows {
        projects.push(row?);
    }

    Ok(projects)
}

pub fn create_project(db_path: &Path, input: CreateProjectInput) -> AppResult<ProjectListItem> {
    let connection = open_connection(db_path)?;
    let id = generate_id("proj");

    connection.execute(
        r#"
        INSERT INTO projects (id, name, description, enabled)
        VALUES (?1, ?2, ?3, ?4)
        "#,
        params![
            id,
            input.name.trim(),
            input.description.trim(),
            input.enabled
        ],
    )?;

    get_project(db_path, &id)?
        .ok_or_else(|| AppError::InvalidState("Created project could not be reloaded".into()))
}

pub fn update_project(db_path: &Path, input: UpdateProjectInput) -> AppResult<ProjectListItem> {
    let connection = open_connection(db_path)?;

    connection.execute(
        r#"
        UPDATE projects
        SET
            name = ?2,
            description = ?3,
            enabled = ?4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?1
        "#,
        params![
            input.id,
            input.name.trim(),
            input.description.trim(),
            input.enabled
        ],
    )?;

    get_project(db_path, &input.id)?
        .ok_or_else(|| AppError::InvalidState("Project was not found for update".into()))
}

pub fn delete_project(db_path: &Path, id: &str) -> AppResult<()> {
    let connection = open_connection(db_path)?;

    connection.execute("DELETE FROM projects WHERE id = ?1", params![id])?;

    Ok(())
}

fn get_project(db_path: &Path, id: &str) -> AppResult<Option<ProjectListItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
            p.id,
            p.name,
            p.description,
            p.enabled,
            (
                SELECT COUNT(*)
                FROM project_variables v
                WHERE v.project_id = p.id AND v.is_secret = 0
            ) AS variable_count,
            (
                SELECT COUNT(*)
                FROM project_variables v
                WHERE v.project_id = p.id AND v.is_secret = 1
            ) AS secret_count,
            (
                SELECT COUNT(*)
                FROM flows f
                WHERE f.project_id = p.id
            ) AS flow_count
        FROM projects p
        WHERE p.id = ?1
        "#,
    )?;

    statement
        .query_row(params![id], map_project_list_item)
        .optional()
        .map_err(Into::into)
}

fn map_project_list_item(row: &rusqlite::Row<'_>) -> rusqlite::Result<ProjectListItem> {
    Ok(ProjectListItem {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        enabled: row.get(3)?,
        variable_count: row.get(4)?,
        secret_count: row.get(5)?,
        flow_count: row.get(6)?,
    })
}

fn generate_id(prefix: &str) -> String {
    let micros = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_micros())
        .unwrap_or_default();

    format!("{prefix}-{micros}")
}
