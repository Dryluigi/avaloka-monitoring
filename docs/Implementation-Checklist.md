# Implementation Checklist

## Purpose

This document breaks the work into implementation phases and checklists.

The first milestone is a prototype without data integration, focused on frontend-only structure and interaction.

---

## Phase 1: Frontend-Only Prototype

Goal:

- create a clickable UI prototype without backend integration
- use static mock data only
- validate layout, navigation, and user flow before wiring real data

Checklist:

- [x] replace the default Tauri starter screen with the monitoring app shell
- [x] create a top-level app layout with navigation and main content area
- [x] create a dashboard page that shows current execution, next execution, failures, and failure messages
- [x] create a project list screen using mock project data
- [x] create a project detail screen using mock flow data
- [x] create a flow list section inside the project detail screen
- [x] show flow interval, enabled state, last run, and next run in the UI
- [x] create a flow detail or flow editor view using mock values
- [x] create a project variables and secrets section with mock entries
- [x] create a prerequisites section in the flow UI
- [x] create a run history section with mock records
- [x] create an alarms/history section with mock records
- [x] create empty states for projects, flows, and run history
- [ ] create loading-style placeholders only if they help the prototype flow
- [x] ensure the layout works on desktop-sized windows
- [x] ensure the prototype is visually consistent across screens

Definition of done:

- the app feels like the target product from a UI perspective
- a user can click through the major screens without backend support
- all displayed data is mocked in frontend code

---

## Phase 2: Local Data Model And Persistence

Goal:

- introduce real local persistence and replace static mock data

Checklist:

- [x] define the Phase 2 Rust/Tauri backend structure in the architecture documentation
- [x] define the SQLite schema for projects, flows, variables, prerequisites, runs, alarms, and flow state
- [x] add Rust models for the persisted entities
- [x] add database initialization on app startup
- [x] implement project CRUD commands
- [x] implement flow CRUD commands
- [x] implement project variable CRUD commands
- [x] implement prerequisite CRUD commands
- [x] expose data-loading commands for the frontend
- [x] replace frontend mock data with Tauri command calls for runs, alarms, and flow state
- [x] handle empty states using real persisted data

Definition of done:

- projects and flows are stored locally
- the app reloads persisted data after restart
- frontend views are backed by real local data

---

## Phase 3: Flow Scheduling And Execution

Goal:

- run flows automatically based on interval and execute external commands

Checklist:

- [x] implement scheduler startup and flow registration
- [x] calculate and persist `last_run_at` and `next_run_at`
- [x] prevent overlap for the same flow
- [x] allow different flows to run independently
- [x] implement external command launching using executable path and args
- [x] support working directory and timeout configuration
- [x] capture stdout, stderr, exit code, and timestamps
- [x] store flow run history after execution
- [x] update the frontend with last-run and next-run data
- [x] implement Tauri event emission for flow execution lifecycle updates
- [x] replace mock `currently executing` dashboard data with Tauri event-backed runtime execution state
- [x] refresh the Projects view automatically while flow execution updates are happening
- [x] refresh the Runs view automatically when new run records are created
- [x] subscribe to Tauri execution events in the frontend shared app state

Definition of done:

- enabled flows execute on schedule
- run results are persisted
- the UI shows scheduling status using real execution data
- Projects and Runs stay updated while the app remains open

---

## Phase 4: Prerequisites And Runtime Context

Goal:

- support prerequisite execution and runtime value propagation

Checklist:

- [x] implement ordered prerequisite execution before the main flow
- [x] stop on first prerequisite failure
- [x] mark the flow as `prerequisite_failed` when applicable
- [x] parse prerequisite stdout as `KEY=value` output
- [x] inject prerequisite output values into later prerequisites
- [x] inject prerequisite output values into the main flow
- [x] inject project variables and secrets into runtime environment
- [ ] inject app-provided runtime metadata such as `FLOW_ID`, `PROJECT_ID`, and `FLOW_RUN_ID`

Definition of done:

- prerequisites block invalid executions
- prerequisite outputs can be consumed by the main flow
- runtime environment includes project and prerequisite context

---

## Phase 5: Flow State Persistence Across Runs

Goal:

- let a flow store values that can be reused in later executions

Checklist:

- [x] define a persisted flow-state storage model
- [x] decide how scripts write state values back to the app
- [x] load stored flow-state values before execution
- [x] inject stored flow-state values into prerequisites and main flow
- [x] persist updated flow-state values after successful execution
- [x] expose flow-state inspection in the UI if needed for debugging

Definition of done:

- a flow can write reusable values
- later runs of the same flow can consume those values
- stored values survive app restart

---

## Phase 6: Alarming And Monitoring Feedback

Goal:

- notify the user when something goes wrong and expose useful diagnostics

Checklist:

- [x] implement local desktop notification integration
- [x] send alarm on prerequisite failure
- [x] send alarm on main script failure
- [x] send alarm on timeout
- [x] send alarm on launch failure
- [x] persist alarm history locally
- [x] show alarm history in the frontend
- [x] show error summary without exposing secrets
- [x] emit Tauri events when alarms are created
- [x] refresh the Alarms view automatically when new alarms are created
- [x] subscribe to Tauri alarm events in the frontend shared app state
- [x] play an alarm sound on supported local platforms

Definition of done:

- failures create visible local alarms
- alarm history is inspectable from the app
- the Alarms view updates while the app remains open

---

## Phase 7: Background App Behavior

Goal:

- keep monitoring active while the app is minimized or hidden

Checklist:

- [x] add tray support
- [x] keep scheduler active when the window is hidden
- [x] add tray actions for show window and quit
- [x] verify alarms still work in background mode
- [x] verify the app restores cleanly from tray state
- [ ] add app auto-start on system startup

Definition of done:

- monitoring continues without keeping the main window open
- the tray flow is usable and reliable

---

## Phase 8: Polish And Hardening

Goal:

- improve quality, clarity, and resilience before broader use

Checklist:

- [ ] improve validation for project and flow forms
- [ ] improve error messaging in the UI
- [ ] review secret-handling paths for accidental exposure
- [ ] add edge-case handling for invalid executable paths
- [ ] add edge-case handling for malformed prerequisite output
- [ ] test restart behavior with persisted scheduling data
- [x] add project name to the Dashboard `What will run next` section
- [x] add project name to the Dashboard alarm stream
- [x] change Dashboard next-execution date formatting to `29 Mar 2026, 21:10:ss`
- [x] change Projects flow-list `Next run` formatting to `29 Mar 2026, 21:10:ss`
- [x] change Projects flow detail `Next run` and `Last run` formatting to `29 Mar 2026, 21:10:ss`
- [x] add project and flow filters to the Runs page
- [ ] add a live clock to the topbar on every page using `29 Mar 2026, 21:10:ss` format
- [ ] add a max height with internal scrolling to the project variables section
- [ ] add a max height with internal scrolling to the recent alarms section in Projects
- [x] hide `STATE:...` and other runtime metadata lines from user-facing run summaries in Projects `Recent runs`
- [x] hide `STATE:...` and other runtime metadata lines from user-facing run summaries in the Runs page
- [ ] clean up UI consistency and empty states
- [ ] review documentation against actual implementation

Definition of done:

- the app is stable enough for real local usage
- docs and behavior match each other
