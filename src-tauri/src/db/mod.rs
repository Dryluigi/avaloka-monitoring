pub mod connection;
pub mod migrations;

use std::path::Path;

use crate::errors::AppResult;

pub fn initialize_database(db_path: &Path) -> AppResult<()> {
    let connection = connection::open_connection(db_path)?;

    migrations::run_migrations(&connection)?;

    Ok(())
}
