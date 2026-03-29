use std::path::Path;

use rusqlite::Connection;

use crate::db::connection::open_connection;
use crate::errors::AppResult;

pub fn bootstrap_scheduler(db_path: &Path) -> AppResult<()> {
    let connection = open_connection(db_path)?;

    pause_disabled_flows(&connection)?;
    register_enabled_flows(&connection)?;

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
