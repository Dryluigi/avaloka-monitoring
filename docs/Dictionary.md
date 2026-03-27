# Dictionary

## Purpose

This document defines the core domain terms used by Advanced Monitoring App.

Use this file as the shared vocabulary for product discussions, implementation, and future documentation.

---

## Project

A `Project` is the main container for monitoring configuration.

A project:

- groups related flows
- stores shared variables and secrets
- provides shared context for all flows inside it

Suggested fields:

- `id`
- `name`
- `description`
- `enabled`
- `created_at`
- `updated_at`

---

## Flow

A `Flow` is an independently scheduled runnable task inside a project.

A flow:

- belongs to one project
- has its own interval
- contains external command configuration
- may contain prerequisites
- can use project-level variables and secrets
- does not overlap with itself while running

Suggested fields:

- `id`
- `project_id`
- `name`
- `enabled`
- `interval_seconds`
- `executable_path`
- `args_json`
- `working_directory`
- `timeout_seconds`
- `last_run_at`
- `next_run_at`
- `created_at`
- `updated_at`

---

## Flow State

A `FlowState` is persisted key/value data owned by a single flow and reused by that same flow in later executions.

A flow state entry:

- belongs to one flow
- survives across executions
- may be written by a completed run
- is available to later prerequisites and the main flow

Suggested fields:

- `id`
- `flow_id`
- `key`
- `value`
- `updated_at`

---

## Prerequisite

A `Prerequisite` is an external command that must pass before the main flow can run.

A prerequisite:

- belongs to one flow
- runs before the main flow execution
- blocks the main script if it fails
- may emit output values for later steps

Suggested fields:

- `id`
- `flow_id`
- `name`
- `order_index`
- `executable_path`
- `args_json`
- `working_directory`
- `timeout_seconds`

---

## Project Variable

A `ProjectVariable` is a reusable value shared by all flows in a project.

A variable may be:

- plain variable
- secret

Suggested fields:

- `id`
- `project_id`
- `key`
- `value`
- `is_secret`

---

## Flow Run

A `FlowRun` records the result of a single flow execution.

The `status` field should use one of the defined flow statuses in the `Flow Status` section below.

If the flow fails, the run should also store a human-readable failure message that can be shown in the dashboard, history, and alarm views.

Suggested fields:

- `id`
- `flow_id`
- `status`
- `started_at`
- `finished_at`
- `exit_code`
- `error_summary`
- `failure_message`
- `stdout`
- `stderr`

---

## Flow Status

`FlowStatus` describes the final outcome of a flow execution.

Supported values:

- `success`
  - the flow finished successfully
  - all prerequisites passed
  - the main command exited with code `0`
- `failed`
  - the main command ran but exited with a non-zero code
- `timed_out`
  - the main command started but did not finish before the configured timeout
- `prerequisite_failed`
  - one of the prerequisites failed
  - the main command was not executed
- `launch_failed`
  - the command could not be started
  - examples include missing executable path or runtime launch error
- `disabled`
  - the flow was disabled and therefore not executed

Use `FlowStatus` as the allowed enum for `FlowRun.status`.

---

## Prerequisite Run

A `PrerequisiteRun` records the result of a prerequisite execution.

Suggested fields:

- `id`
- `flow_run_id`
- `prerequisite_id`
- `status`
- `started_at`
- `finished_at`
- `exit_code`
- `error_summary`
- `stdout`
- `stderr`

---

## Alarm

An `Alarm` is a local desktop notification sent when something goes wrong.

An alarm should include a readable message that explains the failure at a glance.

Suggested fields:

- `id`
- `flow_run_id`
- `project_name`
- `flow_name`
- `message`
- `created_at`
