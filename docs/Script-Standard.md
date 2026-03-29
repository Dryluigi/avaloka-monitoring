# Flow Script Standard

## Purpose

This document defines the runtime contract for external flow scripts and prerequisite scripts used by Advanced Monitoring App.

The goal is to keep script execution predictable, language-agnostic, and easy to integrate with the app scheduler, history system, and alarm system.

---

## Scope

This standard applies to:

- main flow scripts
- prerequisite scripts

This standard does not define:

- how scripts are authored internally in the UI
- inline scripts, because v1 only supports external commands
- language-specific helper libraries

---

## Script Types

In v1, a flow or prerequisite is launched as:

- an executable path
- plus an argument list

Examples:

- `/usr/bin/bash` with args pointing to a `.sh` file
- `/usr/bin/python3` with args pointing to a `.py` file
- `/usr/bin/node` with args pointing to a `.js` file
- a compiled binary path with optional args

The app does not execute raw shell command strings in v1.

---

## Launch Contract

Each script configuration should provide:

- `executable_path`
- `args`
- optional `working_directory`
- optional `timeout_seconds`

The app launches the command exactly as configured.

Recommended approach:

- use absolute executable paths where possible
- keep arguments separated instead of concatenating them into one string
- keep script files executable or invoke them through an explicit interpreter

---

## Environment Variables

Before launching a prerequisite or main flow, the app injects runtime environment variables.

Available sources:

- project variables
- project secrets
- prerequisite output values from earlier successful prerequisites
- app-provided runtime metadata

Example environment variables:

- `BASE_URL`
- `API_TOKEN`
- `SSH_HOST`
- `FLOW_ID`
- `PROJECT_ID`
- `FLOW_RUN_ID`

Rules:

- project variables are available to all prerequisites and the main flow
- secrets are injected at runtime but must not be exposed in logs or alarms
- later prerequisites receive values emitted by earlier prerequisites
- the main flow receives values emitted by all successful prerequisites
- disabled prerequisites are skipped entirely

---

## Success And Failure Contract

### Success

A script is considered successful when:

- the process starts correctly
- the process finishes before timeout
- the exit code is `0`

### Failure

A script is considered failed when:

- the process exits with non-zero code
- the process times out
- the executable cannot be launched

Result mapping:

- main flow non-zero exit maps to `failed`
- main flow timeout maps to `timed_out`
- main flow launch issue maps to `launch_failed`
- prerequisite non-zero exit or timeout maps to `prerequisite_failed`

---

## Output Contract

### Standard Output

The app captures stdout from every prerequisite and main flow.

Stdout is used for:

- diagnostics and history
- prerequisite output values, when applicable

### Standard Error

The app captures stderr from every prerequisite and main flow.

Stderr is used for:

- diagnostics
- error summary generation

Scripts should write useful human-readable failure details to stderr when possible.

When a script fails, its stderr or mapped runtime output should be usable to create a concise failure message for the dashboard, run history, and alarms.

---

## Prerequisite Output Standard

Prerequisites may return values that are passed to later prerequisites and the main flow.

The required format is:

```text
KEY=value
ANOTHER_KEY=another-value
```

Rules:

- one variable per line
- key must be environment-variable safe
- value is everything after the first `=`
- only valid `KEY=value` lines are parsed into runtime variables
- non-matching lines may still be captured in logs, but are ignored as runtime outputs

Example:

```text
SESSION_ID=abc123
TARGET_HOST=10.0.0.12
```

After a successful prerequisite, these values become available to:

- the next prerequisite
- the main flow script

---

## Prerequisite Execution Rules

Prerequisites run before the main flow.

Rules:

1. prerequisites run in configured order
2. if one prerequisite fails, remaining prerequisites do not run
3. if one prerequisite fails, the main flow does not run
4. the flow status becomes `prerequisite_failed`
5. the app sends an alarm immediately

Use prerequisites for:

- connectivity checks
- access validation
- token or session retrieval
- dynamic value discovery needed by the main flow

---

## Main Flow Expectations

The main flow script should:

- read required inputs from environment variables
- perform the monitoring or integration logic
- exit with code `0` on success
- exit non-zero on failure
- write concise diagnostics to stderr when failing
- write failure output that can be converted into a short human-readable failure message

Recommended behavior:

- fail explicitly and early when required env vars are missing
- keep output concise but actionable
- avoid printing secrets

---

## Security Rules

Scripts must treat injected secrets carefully.

Rules:

- do not print secrets to stdout
- do not print secrets to stderr
- do not include secrets in generated error messages
- do not write secrets into files unless absolutely required

The app should also avoid exposing secrets in:

- alarm messages
- UI history
- logs stored in the database

---

## Authoring Recommendations

### General

- prefer deterministic scripts
- make failures explicit with non-zero exit codes
- keep dependencies clear
- keep timeouts realistic
- write short, meaningful error messages

### For Shell Scripts

- use `set -e` when appropriate
- validate required environment variables at startup
- quote variables carefully

### For Python Or Node Scripts

- handle exceptions and exit non-zero on failure
- print actionable diagnostics to stderr
- avoid logging secret values

---

## Example: Prerequisite Script

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ -z "${API_BASE_URL:-}" ]; then
  echo "Missing API_BASE_URL" >&2
  exit 1
fi

SESSION_ID="session-123"
echo "SESSION_ID=$SESSION_ID"
```

Behavior:

- exits `0` on success
- emits `SESSION_ID` for later steps
- exits non-zero if required input is missing

---

## Example: Main Flow Script

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ -z "${API_BASE_URL:-}" ]; then
  echo "Missing API_BASE_URL" >&2
  exit 1
fi

if [ -z "${SESSION_ID:-}" ]; then
  echo "Missing SESSION_ID from prerequisite" >&2
  exit 1
fi

curl -fsS "$API_BASE_URL/health?session=$SESSION_ID" >/dev/null
```

Behavior:

- reads project variable and prerequisite output from env vars
- exits non-zero if the health check fails

---

## Summary

The v1 script contract is intentionally simple:

- every flow and prerequisite is an external command
- success means exit code `0`
- failure means non-zero exit, timeout, or launch error
- project values are passed through environment variables
- prerequisites can pass values forward through stdout `KEY=value` lines
- alarms are triggered when prerequisites or main flows fail
