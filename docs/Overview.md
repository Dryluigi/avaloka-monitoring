# Advanced Monitoring App

## Overview

Advanced Monitoring App is a local desktop monitoring tool that behaves like an integration-oriented monitor runner.

The app lets users organize monitoring setup into `Project`s and `Flow`s. Each flow runs on its own interval, executes an external script or executable, evaluates prerequisites before the main run, and sends a local desktop alarm when something fails.

The product is designed for users who want desktop-based monitoring with flexible scripting, shared project configuration, and persisted local history.

---

## Core Goals

- manage monitoring through projects and flows
- run flows automatically on configured intervals
- support external scripts and executables
- support prerequisites before the main flow execution
- allow prerequisites to produce values for the main flow
- provide reusable project-level variables and secrets
- provide a dashboard that shows what is executing, what will run next, and what is failing
- send local alarms when failures occur
- persist monitoring configuration and history locally

---

## Core Behavior

- A `Project` is a grouping and shared-configuration boundary.
- A `Flow` is the independently scheduled execution unit.
- Flows use external commands, not inline scripts, in v1.
- Project variables and secrets are injected into scripts through environment variables.
- In the current implementation, secret values are masked in the UI, while stronger at-rest secret hardening is still pending.
- Project variables and secrets are already available to main flow scripts at runtime. Prerequisite runtime injection remains part of later work.
- Prerequisites run before the main flow and can emit `KEY=value` outputs for later steps.
- Prerequisites can also be disabled without being deleted.
- Different flows may run concurrently, but the same flow must not overlap with itself.
- Failures trigger local desktop alarms, are recorded in local history, and include a human-readable failure message.
- While the app is open, execution-related UI updates are planned to be driven by Tauri events from the Rust backend.
- In the current UI, running flows are highlighted in the Projects view so execution state is visible without opening the dashboard.

---

## Documentation Map

- Product vocabulary and field suggestions: [Dictionary.md](/home/dryluigi/playgrounds/tauri/adv-monitor/docs/Dictionary.md)
- User-facing requirements and acceptance notes: [User-Stories.md](/home/dryluigi/playgrounds/tauri/adv-monitor/docs/User-Stories.md)
- Runtime contract for flow and prerequisite scripts: [Script-Standard.md](/home/dryluigi/playgrounds/tauri/adv-monitor/docs/Script-Standard.md)
- Frontend wiring and architecture planning: [Architecture.md](/home/dryluigi/playgrounds/tauri/adv-monitor/docs/Architecture.md)
- Implementation progress and completed checklist items: [Implementation-Checklist.md](/home/dryluigi/playgrounds/tauri/adv-monitor/docs/Implementation-Checklist.md)

---

## v1 Scope

Included in v1:

- project CRUD
- flow CRUD
- interval-based flow scheduling
- external script and executable support
- prerequisite support
- prerequisite output values
- project-level variables and secrets
- dashboard overview with execution and failure visibility
- local desktop alarms
- local persistence
- background execution

Not included in v1:

- inline scripts
- Slack or email notifications
- distributed workers
- cloud sync
- advanced secret vault integration
