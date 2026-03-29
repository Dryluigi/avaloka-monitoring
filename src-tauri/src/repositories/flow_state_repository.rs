use std::path::Path;

use crate::db::connection::open_connection;
use crate::dto::flow_state::FlowStateItem;
use crate::errors::AppResult;

pub fn list_flow_state(db_path: &Path) -> AppResult<Vec<FlowStateItem>> {
    let connection = open_connection(db_path)?;
    let mut statement = connection.prepare(
        r#"
        SELECT id, flow_id, key, value, updated_at
        FROM flow_state
        ORDER BY updated_at DESC
        "#,
    )?;

    let rows = statement.query_map([], |row| {
        Ok(FlowStateItem {
            id: row.get(0)?,
            flow_id: row.get(1)?,
            key: row.get(2)?,
            value: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;

    let mut items = Vec::new();
    for row in rows {
      items.push(row?);
    }

    Ok(items)
}
