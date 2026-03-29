use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use crate::errors::AppResult;

use super::types::CommandRunResult;

pub(crate) fn execute_command(
    executable_path: &str,
    args: &[String],
    working_directory: &str,
    timeout_seconds: i64,
    runtime_env: &[(String, String)],
    stage: &str,
) -> AppResult<CommandRunResult> {
    let started_instant = Instant::now();
    let mut command = Command::new(executable_path);

    command
        .args(args)
        .current_dir(if working_directory.is_empty() {
            "."
        } else {
            working_directory
        })
        .env_remove("PYTHONHOME")
        .env_remove("PYTHONPATH")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    for (key, value) in runtime_env {
        command.env(key, value);
    }

    let mut child = command.spawn()?;
    let mut timed_out = false;

    loop {
        if started_instant.elapsed() >= Duration::from_secs(timeout_seconds.max(1) as u64) {
            timed_out = true;
            let _ = child.kill();
            break;
        }

        match child.try_wait()? {
            Some(_) => break,
            None => thread::sleep(Duration::from_millis(200)),
        }
    }

    let output = child.wait_with_output()?;
    let stdout_text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr_text = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let exit_code = output.status.code().map(i64::from);
    let duration_label = format_duration_label(started_instant.elapsed());

    let result = if timed_out {
        CommandRunResult {
            status: if stage == "prerequisite" {
                "prerequisite_failed".into()
            } else {
                "timed_out".into()
            },
            summary: if stage == "prerequisite" {
                "Prerequisite execution timed out".into()
            } else {
                "Flow execution timed out".into()
            },
            failure_message: Some(format!(
                "Process exceeded {} seconds and was terminated.",
                timeout_seconds
            )),
            exit_code,
            stdout_text,
            stderr_text,
            duration_label,
        }
    } else if output.status.success() {
        CommandRunResult {
            status: "success".into(),
            summary: summarize_success(&stdout_text),
            failure_message: None,
            exit_code,
            stdout_text,
            stderr_text,
            duration_label,
        }
    } else {
        let failure = summarize_failure(&stderr_text, &stdout_text, exit_code);
        CommandRunResult {
            status: if stage == "prerequisite" {
                "prerequisite_failed".into()
            } else {
                "failed".into()
            },
            summary: failure.clone(),
            failure_message: Some(failure),
            exit_code,
            stdout_text,
            stderr_text,
            duration_label,
        }
    };

    Ok(result)
}

pub(crate) fn parse_runtime_output_env(stdout_text: &str) -> Vec<(String, String)> {
    stdout_text
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            let (key, value) = trimmed.split_once('=')?;

            if !is_valid_env_key(key) {
                return None;
            }

            Some((key.to_string(), value.to_string()))
        })
        .collect()
}

pub(crate) fn parse_persisted_state_output(stdout_text: &str) -> Vec<(String, String)> {
    stdout_text
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            let directive = trimmed.strip_prefix("STATE:")?;
            let (key, value) = directive.split_once('=')?;

            if !is_valid_env_key(key) {
                return None;
            }

            Some((key.to_string(), value.to_string()))
        })
        .collect()
}

pub(crate) fn upsert_env(runtime_env: &mut Vec<(String, String)>, key: String, value: String) {
    if let Some(entry) = runtime_env.iter_mut().find(|(existing, _)| existing == &key) {
        entry.1 = value;
        return;
    }

    runtime_env.push((key, value));
}

pub(crate) fn is_valid_env_key(key: &str) -> bool {
    let mut chars = key.chars();
    let Some(first) = chars.next() else {
        return false;
    };

    if !(first == '_' || first.is_ascii_alphabetic()) {
        return false;
    }

    chars.all(|char| char == '_' || char.is_ascii_alphanumeric())
}

fn format_duration_label(duration: Duration) -> String {
    let seconds = duration.as_secs();

    if seconds >= 60 {
        let minutes = seconds / 60;
        let remainder = seconds % 60;

        if remainder == 0 {
            format!("{minutes}m")
        } else {
            format!("{minutes}m {remainder}s")
        }
    } else {
        format!("{seconds}s")
    }
}

fn summarize_success(stdout_text: &str) -> String {
    if stdout_text.is_empty() {
        "Flow completed successfully".into()
    } else {
        truncate_text(stdout_text)
    }
}

fn summarize_failure(stderr_text: &str, stdout_text: &str, exit_code: Option<i64>) -> String {
    if !stderr_text.is_empty() {
        truncate_text(stderr_text)
    } else if !stdout_text.is_empty() {
        truncate_text(stdout_text)
    } else if let Some(code) = exit_code {
        format!("Process exited with code {code}")
    } else {
        "Flow execution failed".into()
    }
}

fn truncate_text(value: &str) -> String {
    let trimmed = value.trim();
    const LIMIT: usize = 280;

    if trimmed.chars().count() <= LIMIT {
        trimmed.to_string()
    } else {
        let shortened: String = trimmed.chars().take(LIMIT).collect();
        format!("{shortened}...")
    }
}
