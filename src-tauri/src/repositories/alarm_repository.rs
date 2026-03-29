use std::path::Path;

use crate::db::connection::open_connection;
use crate::dto::alarm::AlarmItem;
use crate::errors::AppResult;

pub fn list_alarms(db_path: &Path) -> AppResult<Vec<AlarmItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT
            a.id,
            a.flow_id,
            f.name,
            p.id,
            p.name,
            a.severity,
            a.created_at,
            a.message
        FROM alarms a
        INNER JOIN flows f ON f.id = a.flow_id
        INNER JOIN projects p ON p.id = f.project_id
        ORDER BY a.created_at DESC
        "#,
    )?;

    let rows = statement.query_map([], |row| {
        Ok(AlarmItem {
            id: row.get(0)?,
            flow_id: row.get(1)?,
            flow_name: row.get(2)?,
            project_id: row.get(3)?,
            project_name: row.get(4)?,
            severity: row.get(5)?,
            created_at: row.get(6)?,
            message: row.get(7)?,
        })
    })?;

    let mut items = Vec::new();
    for row in rows {
      items.push(row?);
    }

    Ok(items)
}
