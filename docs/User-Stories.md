# User Stories

## Purpose

This document captures the main user stories for Advanced Monitoring App v1.

It describes what users need to do in the system and what behavior they should expect from the product.

---

## Project Management

### Create Project

As a user, I want to create a project so that I can group related monitoring flows under one shared configuration.

Acceptance notes:

- user can enter project name
- user can optionally enter description
- new project is persisted locally

### View Projects

As a user, I want to view all projects so that I can see the monitoring groups I have configured.

Acceptance notes:

- user can view project list
- each project shows basic metadata
- user can open a project detail screen

### Update Project

As a user, I want to update a project so that I can rename it or adjust its metadata later.

Acceptance notes:

- user can edit project name
- user can edit description
- changes are persisted locally

### Delete Project

As a user, I want to delete a project so that I can remove monitoring setups I no longer need.

Acceptance notes:

- user can delete a project
- related flows and configuration are removed with it or handled consistently by the app

---

## Flow Management

### Create Flow

As a user, I want to create a flow inside a project so that I can define a scheduled monitoring task.

Acceptance notes:

- flow is created within a selected project
- user can define the main runtime configuration for the flow

### View Flows

As a user, I want to view flows inside a project so that I can understand what monitoring tasks belong to that project.

Acceptance notes:

- user can see all flows in a project
- flow list shows essential details such as name, interval, and status

### Update Flow

As a user, I want to update a flow so that I can change its schedule or execution behavior.

Acceptance notes:

- user can edit flow metadata and runtime configuration
- changes are persisted locally

### Delete Flow

As a user, I want to delete a flow so that I can remove monitoring tasks I no longer need.

Acceptance notes:

- user can delete a flow from a project
- user can delete a flow from the flow edit drawer
- deleted flow no longer participates in scheduling
- deleted flow is removed from the project view immediately

---

## Scheduling

### Configure Interval

As a user, I want to set an interval on a flow so that it runs automatically at the cadence I need.

Acceptance notes:

- interval is configured per flow
- interval is stored persistently
- the scheduler uses the configured interval for future runs

### Run Flows Independently

As a user, I want each flow to run independently so that one flow schedule does not control another flow schedule.

Acceptance notes:

- each flow is treated as its own scheduled unit
- different flows may run concurrently
- the same flow must not overlap with itself

### Check Last Run And Next Run

As a user, I want to check the last run and next run of a flow so that I can understand its recent activity and upcoming schedule.

Acceptance notes:

- user can see the most recent run time of a flow
- user can see the next scheduled run time of a flow
- scheduling information is updated after each execution
- the UI shows this information in a flow detail view or list view

### Inspect Flow Run History

As a user, I want to inspect the recent run history of a flow so that I can review outcomes without leaving the project screen.

Acceptance notes:

- user can see recent run records for the selected flow
- run history includes status, summary, and failure message when present
- run history supports pagination when the selected flow has many records

### View Dashboard At A Glance

As a user, I want a dashboard page that gives me enough information in one look so that I can understand the current operational state without opening multiple screens.

Acceptance notes:

- dashboard shows what is currently executing
- dashboard shows what will be executed next
- dashboard shows which flows are currently failing
- dashboard shows recent alarms
- dashboard stays readable without requiring deep navigation

---

## Script Support

### Configure External Script

As a user, I want to attach an external script or executable to a flow so that I can run custom monitoring logic using my preferred tooling.

Acceptance notes:

- flow stores executable path
- flow stores argument list
- flow can store working directory and timeout if needed

### Run Script With Project Context

As a user, I want my flow script to receive project context so that I can reuse shared configuration across multiple flows.

Acceptance notes:

- project variables are exposed as environment variables
- project secrets are exposed as environment variables at runtime
- flow script can read those values directly from the process environment

---

## Prerequisite Support

### Define Prerequisites

As a user, I want to define prerequisites for a flow so that required checks happen before the main script runs.

Acceptance notes:

- a flow can have multiple prerequisites
- prerequisites run in configured order
- prerequisites are stored as part of flow configuration
- a prerequisite can be disabled without deleting it

### Disable Prerequisites

As a user, I want to disable a prerequisite without deleting it so that I can temporarily skip a setup check while keeping its configuration.

Acceptance notes:

- user can disable a prerequisite from its edit form
- disabled prerequisites remain visible in the project UI
- disabled prerequisites are marked clearly as disabled
- disabled prerequisites do not participate in execution

### Block Main Flow On Prerequisite Failure

As a user, I want the main flow to stop when a prerequisite fails so that invalid execution does not continue.

Acceptance notes:

- if any prerequisite fails, the main flow does not run
- flow result becomes `prerequisite_failed`
- the app records failure details
- the app sends an alarm
- the failure message names the prerequisite that caused the failure

### Pass Values From Prerequisite To Main Flow

As a user, I want a prerequisite to output values for the main script so that setup or discovery logic can be reused during execution.

Acceptance notes:

- prerequisite can emit `KEY=value` lines on stdout
- emitted values are parsed by the app
- parsed values are injected into later prerequisites and the main flow as environment variables

---

## Variables And Secrets

### Create Project Variables

As a user, I want to define project variables so that shared values do not need to be repeated in every flow.

Acceptance notes:

- user can create key/value variables in a project
- variables are persisted locally
- variables are available to all flows in the project

### Create Project Secrets

As a user, I want to define project secrets so that sensitive values can be used by flows without hardcoding them into scripts.

Acceptance notes:

- user can create secret values in a project
- secrets are persisted locally for v1
- secrets are masked in the UI where appropriate
- secrets are available to all flows in the project at runtime
- stronger at-rest secret hardening is still a follow-up task

---

## Flow State

### Store Flow Value For Later Execution

As a user, I want a flow to store values that can be used in its next execution so that the flow can keep state across runs.

Acceptance notes:

- a flow can persist key/value data after execution
- prerequisites and the main flow can persist values by emitting `STATE:KEY=value` lines on stdout
- persisted values are available to the same flow in later executions
- persisted values survive app restart
- flow state is scoped to the flow and does not automatically leak to other flows

### Use Stored Flow Value In Next Execution

As a user, I want my next flow execution to read values stored by previous runs so that the script can compare, continue, or resume work.

Acceptance notes:

- stored flow values are injected into the runtime of the next execution
- stored values can be read by prerequisites and the main flow
- missing stored values are handled gracefully by the script or runtime contract

---

## Alarming

### Send Alarm On Failure

As a user, I want to receive a local alarm when a flow fails so that I know something needs attention immediately.

Acceptance notes:

- alarm is sent when prerequisite fails
- alarm is sent when main script fails
- alarm is sent when script times out
- alarm is sent when script cannot be launched
- every failure event includes a human-readable failure message

### Receive Actionable Alarm Context

As a user, I want the alarm to include useful context so that I can quickly identify what failed.

Acceptance notes:

- alarm includes project name
- alarm includes flow name
- alarm includes a short failure summary or failure message
- alarm does not expose secret values

---

## Monitoring History

### Review Flow History

As a user, I want to review historical flow runs so that I can inspect failures and understand monitoring behavior over time.

Acceptance notes:

- flow run history is persisted locally
- user can inspect flow status, timestamps, and failure summary
- user can inspect the failure message when a run fails
- stdout and stderr are available for diagnostics within app-defined limits

### Review Failure Message Quickly

As a user, I want failed runs to display a clear failure message so that I can understand the issue without opening raw logs first.

Acceptance notes:

- failed runs include a human-readable failure message
- prerequisite failures include a prerequisite failure message
- prerequisite failure messages include the prerequisite name and the reason
- timeout failures include a timeout-specific failure message
- failure messages are shown in dashboard and run-history views

### Review Alarm History

As a user, I want to review alarm history so that I can understand what problems occurred previously.

Acceptance notes:

- alarm history is persisted locally
- user can inspect recent alarms after app restart

---

## Background Behavior

### Keep Monitoring Running In Background

As a user, I want monitoring to continue while the app is minimized so that scheduled checks still run without keeping the window open.

Acceptance notes:

- scheduler continues running in background mode
- minimizing the window does not stop active monitoring
- local alarms still work while the app is minimized
