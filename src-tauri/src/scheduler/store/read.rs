use std::path::Path;

use rusqlite::{params, Connection};

use crate::db::connection::open_connection;
use crate::errors::AppResult;

use super::super::runtime::is_valid_env_key;
use super::super::types::{DueFlow, PrerequisiteSpec};

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

pub(crate) fn current_local_datetime(db_path: &Path) -> AppResult<String> {
    let connection = open_connection(db_path)?;
    connection
        .query_row("SELECT datetime('now', 'localtime')", [], |row| row.get(0))
        .map_err(Into::into)
}
