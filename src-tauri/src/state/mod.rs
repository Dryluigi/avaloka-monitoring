use std::path::PathBuf;

#[derive(Clone, Debug)]
pub struct AppState {
    pub db_path: PathBuf,
}

impl AppState {
    pub fn new(db_path: PathBuf) -> Self {
        Self { db_path }
    }
}
