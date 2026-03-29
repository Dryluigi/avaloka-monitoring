mod commands;
mod db;
mod dto;
mod errors;
mod models;
mod repositories;
mod scheduler;
mod state;

use tauri::menu::{Menu, MenuItem};
#[cfg(not(target_os = "linux"))]
use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
use tauri::tray::TrayIconBuilder;
use tauri::{Manager, WindowEvent};

use state::AppState;

const TRAY_SHOW_ID: &str = "tray-show-window";
const TRAY_QUIT_ID: &str = "tray-quit-app";

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn build_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, TRAY_SHOW_ID, "Show window", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, TRAY_QUIT_ID, "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    let builder = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            TRAY_SHOW_ID => show_main_window(app),
            TRAY_QUIT_ID => app.exit(0),
            _ => {}
        });

    #[cfg(not(target_os = "linux"))]
    let builder = builder.on_tray_icon_event(|tray, event| {
        if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Down,
            ..
        } = event
        {
            show_main_window(&tray.app_handle());
        }
    });

    let builder = if let Some(icon) = app.default_window_icon().cloned() {
        builder.icon(icon)
    } else {
        builder
    };

    builder.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            let db_path = app_data_dir.join("adv-monitor.sqlite3");

            db::initialize_database(&db_path)?;
            scheduler::bootstrap_scheduler(&db_path)?;
            scheduler::start_scheduler(db_path.clone(), app.handle().clone());
            app.manage(AppState::new(db_path));
            build_tray(app.handle())?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }

            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::project_commands::list_projects,
            commands::project_commands::create_project,
            commands::project_commands::update_project,
            commands::project_commands::delete_project,
            commands::flow_commands::list_flows,
            commands::flow_commands::create_flow,
            commands::flow_commands::update_flow,
            commands::flow_commands::delete_flow,
            commands::project_variable_commands::list_project_variables,
            commands::project_variable_commands::create_project_variable,
            commands::project_variable_commands::update_project_variable,
            commands::project_variable_commands::delete_project_variable,
            commands::prerequisite_commands::list_prerequisites,
            commands::prerequisite_commands::create_prerequisite,
            commands::prerequisite_commands::update_prerequisite,
            commands::prerequisite_commands::delete_prerequisite,
            commands::runtime_read_commands::list_flow_runs,
            commands::runtime_read_commands::list_alarms,
            commands::runtime_read_commands::list_flow_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
