use std::path::Path;

use crate::db::connection::open_connection;
use crate::dto::flow_run::FlowRunItem;
use crate::errors::AppResult;

pub fn list_flow_runs(db_path: &Path) -> AppResult<Vec<FlowRunItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
            fr.id,
            fr.flow_id,
            f.name,
            p.id,
            p.name,
            fr.status,
            fr.started_at,
            fr.finished_at,
            fr.duration_label,
            fr.summary,
            fr.failure_message
        FROM flow_runs fr
        INNER JOIN flows f ON f.id = fr.flow_id
        INNER JOIN projects p ON p.id = f.project_id
        ORDER BY fr.started_at DESC
        "#,
    )?;

    let rows = statement.query_map([], |row| {
        Ok(FlowRunItem {
            id: row.get(0)?,
            flow_id: row.get(1)?,
            flow_name: row.get(2)?,
            project_id: row.get(3)?,
            project_name: row.get(4)?,
            status: row.get(5)?,
            started_at: row.get(6)?,
            finished_at: row.get(7)?,
            duration_label: row.get(8)?,
            summary: row.get(9)?,
            failure_message: row.get(10)?,
        })
    })?;

    let mut items = Vec::new();
    for row in rows {
      items.push(row?);
    }

    Ok(items)
}
