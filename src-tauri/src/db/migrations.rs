use rusqlite::{params, Connection};

use crate::errors::AppResult;

pub fn run_migrations(connection: &Connection) -> AppResult<()> {
    connection.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS project_variables (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            is_secret INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS flows (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            interval_seconds INTEGER NOT NULL DEFAULT 300,
            executable_path TEXT NOT NULL,
            args_json TEXT NOT NULL DEFAULT '[]',
            working_directory TEXT NOT NULL DEFAULT '',
            timeout_seconds INTEGER NOT NULL DEFAULT 60,
            last_run_at TEXT,
            next_run_at TEXT,
            status TEXT NOT NULL DEFAULT 'disabled',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS prerequisites (
            id TEXT PRIMARY KEY,
            flow_id TEXT NOT NULL,
            name TEXT NOT NULL,
            executable_path TEXT NOT NULL,
            args_json TEXT NOT NULL DEFAULT '[]',
            order_index INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'ready',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS flow_runs (
            id TEXT PRIMARY KEY,
            flow_id TEXT NOT NULL,
            status TEXT NOT NULL,
            started_at TEXT NOT NULL,
            finished_at TEXT NOT NULL,
            duration_label TEXT NOT NULL DEFAULT '',
            summary TEXT NOT NULL DEFAULT '',
            failure_message TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS alarms (
            id TEXT PRIMARY KEY,
            flow_id TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'warning',
            created_at TEXT NOT NULL,
            message TEXT NOT NULL,
            FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS flow_state (
            id TEXT PRIMARY KEY,
            flow_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_project_variables_project_key
        ON project_variables(project_id, key);

        CREATE UNIQUE INDEX IF NOT EXISTS idx_flow_state_flow_key
        ON flow_state(flow_id, key);
        "#,
    )?;

    seed_default_projects(connection)?;

    Ok(())
}

fn seed_default_projects(connection: &Connection) -> AppResult<()> {
    let existing_count: i64 =
        connection.query_row("SELECT COUNT(*) FROM projects", [], |row| row.get(0))?;

    if existing_count > 0 {
        return Ok(());
    }

    let seed_projects = [
        (
            "proj-api",
            "Production API",
            "Checks login, health endpoints, and background token refresh.",
            true,
        ),
        (
            "proj-ssh",
            "Remote SSH Jobs",
            "Monitors SSH reachability and nightly sync completion.",
            true,
        ),
        (
            "proj-store",
            "Storefront",
            "Tracks customer-facing pages, checkout, and payment redirect health.",
            true,
        ),
        (
            "proj-billing",
            "Billing",
            "Verifies invoice sync, gateway health, and webhook handling.",
            true,
        ),
        (
            "proj-warehouse",
            "Warehouse",
            "Monitors queue lag, stock sync, and packing-job completion.",
            true,
        ),
        (
            "proj-notify",
            "Notifications",
            "Checks outbound email, SMS, and push delivery pipelines.",
            true,
        ),
        (
            "proj-ops",
            "Ops Health",
            "Infrastructure-facing checks for disk, CPU, and deployment heartbeat.",
            true,
        ),
        (
            "proj-empty",
            "New Monitoring Space",
            "Reserved for the next integration flow set.",
            false,
        ),
    ];

    let mut statement = connection.prepare(
        r#"
        INSERT INTO projects (id, name, description, enabled)
        VALUES (?1, ?2, ?3, ?4)
        "#,
    )?;

    for (id, name, description, enabled) in seed_projects {
        statement.execute(params![id, name, description, enabled])?;
    }

    Ok(())
}
