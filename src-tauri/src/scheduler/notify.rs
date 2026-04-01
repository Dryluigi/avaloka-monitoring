use std::path::{Path, PathBuf};
use std::process::Command;

use tauri::path::BaseDirectory;
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_notification::NotificationExt;

use crate::errors::AppResult;

use super::events::emit_alarm_created;
use super::store::persist_alarm;
use super::types::DueFlow;

pub(crate) fn create_alarm_record(
    db_path: &Path,
    app_handle: &AppHandle,
    flow: &DueFlow,
    created_at: &str,
    message: &str,
) -> AppResult<()> {
    persist_alarm(db_path, &flow.id, "critical", created_at, message)?;
    emit_alarm_created(app_handle, &flow.id);
    show_desktop_notification(app_handle, flow, message);
    play_alarm_sound(app_handle);
    Ok(())
}

fn show_desktop_notification(app_handle: &AppHandle, flow: &DueFlow, message: &str) {
    let title = format!("{} / {}", flow.project_name, flow.name);

    #[cfg(target_os = "linux")]
    {
        if send_linux_notification(&title, message).is_ok() {
            return;
        }
    }

    if let Err(error) = app_handle
        .notification()
        .builder()
        .title(&title)
        .body(message)
        .show()
    {
        eprintln!("Tauri desktop notification failed: {error}");
        fallback_linux_notification(&title, message);
    }
}

#[cfg(target_os = "linux")]
fn send_linux_notification(title: &str, message: &str) -> Result<(), std::io::Error> {
    Command::new("notify-send")
        .args([
            "--app-name=adv-monitor",
            "--urgency=critical",
            title,
            message,
        ])
        .spawn()?;

    Ok(())
}

#[cfg(target_os = "linux")]
fn fallback_linux_notification(title: &str, message: &str) {
    if let Err(error) = send_linux_notification(title, message) {
        eprintln!("Linux notify-send fallback failed: {error}");
    }
}

#[cfg(not(target_os = "linux"))]
fn fallback_linux_notification(_title: &str, _message: &str) {}

#[cfg(target_os = "linux")]
fn play_alarm_sound(app_handle: &AppHandle) {
    let candidate_paths = [
        app_handle
            .path()
            .resolve("notification_error_sound.mp3", BaseDirectory::Resource)
            .ok(),
        app_handle
            .path()
            .resolve("resources/notification_error_sound.mp3", BaseDirectory::Resource)
            .ok(),
        Some(PathBuf::from("src-tauri/resources/notification_error_sound.mp3")),
        Some(PathBuf::from("resources/notification_error_sound.mp3")),
    ];

    let Some(sound_path) = candidate_paths
        .into_iter()
        .flatten()
        .find(|path| path.exists())
    else {
        eprintln!("Could not find alarm sound in bundled resources or dev paths");
        return;
    };

    if let Err(error) = Command::new("paplay").arg(sound_path).spawn() {
        eprintln!("Linux paplay alarm sound failed: {error}");
    }
}

#[cfg(not(target_os = "linux"))]
fn play_alarm_sound(_app_handle: &AppHandle) {}
