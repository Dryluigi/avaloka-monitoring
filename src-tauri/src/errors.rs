use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum AppError {
    Io(std::io::Error),
    Database(rusqlite::Error),
    InvalidState(String),
}

impl Display for AppError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(error) => write!(f, "I/O error: {error}"),
            Self::Database(error) => write!(f, "Database error: {error}"),
            Self::InvalidState(message) => write!(f, "{message}"),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Database(error)
    }
}

pub type AppResult<T> = Result<T, AppError>;
