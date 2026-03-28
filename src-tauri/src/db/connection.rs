use std::fs;
use std::path::Path;

use rusqlite::Connection;

use crate::errors::AppResult;

pub fn open_connection(db_path: &Path) -> AppResult<Connection> {
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let connection = Connection::open(db_path)?;
    connection.pragma_update(None, "foreign_keys", "ON")?;

    Ok(connection)
}
