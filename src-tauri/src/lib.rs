mod commands;
mod db;
mod dto;
mod errors;
mod models;
mod repositories;
mod state;

use tauri::Manager;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            let db_path = app_data_dir.join("adv-monitor.sqlite3");

            db::initialize_database(&db_path)?;
            app.manage(AppState::new(db_path));

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::project_commands::list_projects,
            commands::project_commands::create_project,
            commands::project_commands::update_project,
            commands::project_commands::delete_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
