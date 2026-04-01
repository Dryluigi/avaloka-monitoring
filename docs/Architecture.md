# Application Architecture

## Overview
The app is currently split into two layers:

- a React desktop-style frontend
- a Tauri/Rust backend that is still mostly starter-level today, but now has a defined Phase 2 target structure

The frontend already has a production-leaning shape, while the backend is about to move from prototype scaffolding into local persistence and CRUD support.

The main design goal is to keep both sides easy to evolve without forcing a large rewrite when Phase 2 begins.

---

## Frontend Architecture

The current frontend is structured with a clear separation between:

- app shell and navigation
- shared app state
- page-level views
- reusable UI primitives
- mock data and frontend-only configuration

The main design goal is to keep the app easy to evolve from prototype into a real product without rewriting the entire frontend structure.

---

## Frontend Structure

### App shell
File:
- `src/App.tsx`

Responsibility:
- render the application shell
- control top-level navigation state
- control mobile sidebar visibility
- render the active page
- mount the shared app state provider
- mount the global drawer

`App.tsx` should stay thin. It is intentionally not responsible for preparing large page-specific payloads anymore.

---

### Shared app state
File:
- `src/state/AppStateContext.tsx`

Responsibility:
- hold shared frontend application state
- expose setters for interactive prototype editing
- provide common selection state used across pages

Current shared state includes:
- `projects`
- `flows`
- `variables`
- `prerequisites`
- `selectedProjectId`
- `selectedFlowId`
- `flowFilter`
- `drawer`

Why context is used:
- to reduce prop drilling
- to avoid large prop lists on every screen
- to let each page read only the state it needs
- to keep the app shell focused on layout instead of page data wiring

This is currently the practical app-level state store for the desktop app.

---

### Page views
Files:
- `src/components/DashboardView.tsx`
- `src/components/ProjectsView.tsx`
- `src/components/projects/ProjectSidebar.tsx`
- `src/components/projects/ProjectHeader.tsx`
- `src/components/projects/FlowListSection.tsx`
- `src/components/projects/ProjectMetaPanels.tsx`
- `src/components/projects/FlowInspectorPanels.tsx`
- `src/components/RunsView.tsx`
- `src/components/AlarmsView.tsx`

Responsibility:
- own the display logic for one top-level page
- derive page-specific data from shared app state and mock data
- trigger actions by updating shared app state

Examples:
- `DashboardView` reads flows from app state and combines them with mock runs and alarms to derive summary cards, failing items, and upcoming items.
- `ProjectsView` now acts as the coordinator for project-specific state, while section components such as `ProjectSidebar`, `FlowListSection`, and `FlowInspectorPanels` own the major UI slices.
- `RunsView` owns run pagination.
- `AlarmsView` owns alarm list presentation.

Design rule:
- page components should own page-specific data shaping
- `App.tsx` should not assemble page payloads for them

This keeps each page more autonomous and reduces coupling with the shell.

For the larger pages, the same rule now applies one level deeper:
- the top-level view coordinates selection and derived data
- section components render one coherent part of the screen
- helpers hold small formatting or derivation utilities that would otherwise bloat the view

---

### Drawer
Files:
- `src/components/Drawer.tsx`
- `src/components/drawer/DrawerShell.tsx`
- `src/components/drawer/ProjectDrawerForm.tsx`
- `src/components/drawer/FlowDrawerForm.tsx`
- `src/components/drawer/VariableDrawerForm.tsx`
- `src/components/drawer/PrerequisiteDrawerForm.tsx`

Responsibility:
- `Drawer.tsx` resolves which drawer form is active
- `DrawerShell.tsx` renders the shared overlay and layout
- each drawer form owns one persisted entity editor
- drawer forms read shared state directly and perform their own save/delete actions

Why drawer is global:
- it behaves like an app-level overlay
- it may be triggered from different pages
- centralizing it avoids duplicate modal logic in each page

The drawer is part of the app shell layer, but the form behavior is now split into focused components instead of one large file.

---

### Global confirmation dialog
Files:
- `src/state/ConfirmDialogContext.tsx`

Responsibility:
- provide a reusable app-level confirmation popup
- expose a simple promise-based `confirm(...)` API
- keep destructive-action confirmation behavior consistent across features

Why it is global:
- destructive actions can be triggered from different forms and screens
- centralizing confirmation avoids duplicated modal state and browser-native confirm dialogs
- feature components stay focused on their own save/delete logic instead of popup orchestration

Design rule:
- feature components should request confirmation through the shared confirmation context
- the confirmation popup should be reused instead of reimplemented per screen

---

### Reusable UI primitives
Files:
- `src/components/ui/buttons.tsx`
- `src/components/ui/form-controls.tsx`
- `src/components/ui/layout.tsx`
- `src/components/ui/metrics.tsx`
- `src/components/ui/status.tsx`

Responsibility:
- provide shared presentation primitives
- keep view files focused on screen logic instead of repeated low-level markup

Examples:
- `ActionButton`
- `DrawerActions`
- `Input`
- `TextArea`
- `ToggleGroup`
- `CardSection`
- `Field`
- `StatCard`
- `Metric`
- `MetricPanel`
- `StatusPill`
- `EmptyState`
- `SmallEmptyState`

Design rule:
- these components should stay dumb and reusable
- they should not own app state or business logic

---

### Frontend support layers
Files:
- `src/data/mock-data.ts`
- `src/lib/config.ts`
- `src/lib/project-summary.ts`
- `src/services/project-api.ts`
- `src/services/flow-api.ts`
- `src/services/project-variable-api.ts`
- `src/services/prerequisite-api.ts`
- `src/types/app.ts`

Responsibility:
- define shared frontend types
- hold temporary mock datasets for domains not yet wired to persistence
- provide shared constants like navigation items and status display metadata
- provide frontend service wrappers for Tauri commands
- provide mapping helpers for UI-facing summaries

At the current stage:
- projects, flows, project variables, prerequisites, runs, alarms, and flow-state detail are loaded through Tauri service wrappers
- the dashboard `currently executing` section is fed from Tauri execution lifecycle events
- project secrets are currently masked in frontend responses, but not yet hardened with stronger at-rest secret storage
- real-time execution UI updates use Tauri events as the primary mechanism instead of frontend polling
- flow execution already injects project variables and secrets into the runtime environment for main flow commands
- enabled prerequisites now execute in order before the main flow and can extend the runtime environment through `KEY=value` stdout output
- persisted flow-state values are also loaded into the runtime environment before prerequisites and the main flow begin
- successful prerequisites and main flows can persist cross-run flow state through `STATE:KEY=value` stdout lines

This separation matters because it lets us replace the remaining mock-backed domains without rewriting the UI structure.

---

## Frontend Wiring Strategy

### 1. App shell owns only shell concerns
`App.tsx` is responsible for:
- current section
- mobile navigation open/close
- topbar behavior
- page switching
- global overlay mounting
- global confirmation-provider mounting

It is not responsible for:
- dashboard-specific calculations
- project filtering logic
- run pagination
- alarm list shaping

That logic now lives closer to the page that uses it.

### 2. Shared state is centralized
Interactive data used by multiple screens lives in `src/state/AppStateContext.tsx`.

This includes:
- editable project and flow data
- current selected project and flow
- filter state
- drawer state
- access to shared app-level confirmation behavior

This is the minimum shared layer needed to avoid excessive prop passing.

For real-time behavior, this same shared state layer is also the intended subscription point for Tauri events. The frontend should listen once at the app-state level, update the base entities there, and let pages re-derive their own display state.

### 3. Pages derive their own display state
Each page reads base state and derives local view state.

Examples:
- `DashboardView` derives summary totals and upcoming flows
- `ProjectsView` derives selected project details and filtered flow lists
- `RunsView` derives the current page slice
- `AlarmsView` derives its list directly from alarm data

This keeps derived state local to the page instead of duplicating it globally.

### 4. Global overlay reads shared state directly
The drawer uses shared app state instead of receiving large prop objects from the shell.

That means:
- any page can trigger the drawer by updating `drawer`
- the drawer reads the current entities it needs from shared state
- save actions update the shared state directly

This is a good fit for a desktop app pattern where overlays are global UI concerns.

The confirmation popup follows the same principle:
- any feature component can request confirmation through `useConfirmDialog()`
- the provider owns popup state and rendering once at the app-shell level
- destructive actions stay consistent without duplicating local modal logic

---

## Why This Architecture

### Reduced prop sprawl
One of the main reasons for the current structure is to avoid passing many props from `App.tsx` into every page.

This was becoming a problem because:
- each screen needed more data
- each screen also needed several action handlers
- the shell started to look like a page coordinator instead of a layout component

Moving to shared app state plus page-owned derivation solved that.

### Easier refactoring
By splitting:
- page components
- UI primitives
- mock data
- shared app state

the codebase is easier to navigate and safer to change.

### Better transition path to real backend integration
The structure already mirrors how a production app would likely be wired:
- shared state layer
- page-level data composition
- reusable UI layer
- global overlay layer
- backend event emission for runtime changes

That means we can replace mock data incrementally without restructuring every screen.

---

## Architecture Planning

### Near-term frontend plan

### 1. Keep pages responsible for page-specific derivation
Continue this rule:
- shared app state stores base entities and shared UI state
- pages compute page-specific selections and summaries

This prevents the context from becoming bloated with view-only computed values.

### 2. Keep reusable UI components presentation-only
UI primitives should remain free from business logic.

This makes them:
- easier to reuse
- easier to test
- easier to replace later with a design system if needed

### 3. Split shell components next
The next natural structural step is to split:
- sidebar
- topbar
- mobile navigation

out of `App.tsx`.

That would make the shell layer as modular as the page layer already is.

### 4. Use Tauri events for live updates
For live execution feedback, the primary mechanism is Tauri events rather than frontend polling.

Event examples in this architecture:
- `flow-execution-started`
- `flow-execution-finished`
- `alarm-created`

Current and planned wiring:
- the Rust backend emits events when execution state changes
- `src/state/AppStateContext.tsx` subscribes to those events once
- shared state is updated in response to those events
- `DashboardView`, `ProjectsView`, `RunsView`, and `AlarmsView` re-render from shared state changes

Current scope:
- execution start and finish events are implemented
- active execution cards in the dashboard are driven by event-backed state
- `Projects` and `Runs` refresh after execution finishes by reloading persisted data in shared app state
- alarm-created events are emitted when runtime failures persist new alarms
- the `Alarms` view refreshes through shared app-state subscription to alarm events

Why this fits the app:
- the app is desktop and long-running
- execution changes originate in Rust
- `currently executing` state is naturally event-driven
- it avoids periodic reloads when no changes are happening

---

## Backend Architecture For Phase 2

## Goals for Phase 2
Phase 2 introduces the first real backend responsibilities:

- local SQLite persistence
- database initialization at app startup
- Rust-side entity models
- Tauri commands for CRUD and data loading
- frontend replacement of mock entity data with Tauri-backed reads and writes

Phase 2 does not yet include:

- scheduling
- external process execution
- prerequisites execution
- alarms delivery
- tray/background runtime behavior

Those remain in later phases.

## Current Runtime Notes

- The scheduler now injects project variables and secrets into the main flow process environment before launch.
- Variables are passed using their configured keys as environment variable names.
- Keys must be environment-variable safe to be injected cleanly.
- Enabled prerequisites now run before the main flow in configured order.
- The first failing prerequisite stops later prerequisites and skips the main flow.
- Successful prerequisites can emit `KEY=value` lines on stdout, and those values are injected into later prerequisites and the main flow.
- Stored flow-state values are loaded before execution and injected into prerequisites and the main flow as runtime environment variables.
- Successful prerequisites and main flows can emit `STATE:KEY=value` lines on stdout to persist flow-scoped values for future runs.
- Dedicated prerequisite run history is intentionally not planned right now; the product relies on clear parent flow failure messages that name the failing prerequisite.
- Runtime failures now persist alarm records locally.
- Alarm creation emits a Tauri event so the frontend can refresh alarm state while the app is open.
- Runtime failures also trigger local desktop notifications through the Tauri notification plugin.
- On Linux, runtime failures also trigger a warning sound through `paplay` using the system dialog-warning sound.
- The desktop app now installs a tray icon with `Show window` and `Quit` actions.
- Closing the main window is intercepted and converted into hide-to-tray behavior so the scheduler keeps running.

---

## Current Tauri Backend

Current files:
- `src-tauri/src/main.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/scheduler/mod.rs`
- `src-tauri/src/scheduler/events.rs`
- `src-tauri/src/scheduler/runtime.rs`
- `src-tauri/src/scheduler/store.rs`
- `src-tauri/src/scheduler/types.rs`

Current state:
- `main.rs` boots the app
- `lib.rs` contains the Tauri builder and startup composition
- `scheduler/mod.rs` coordinates scheduling and flow execution
- scheduler helpers are split by responsibility into event emission, runtime command handling, query/storage access, and shared scheduler types

This is no longer just the default Tauri baseline. The backend has started moving into a more maintainable module-oriented shape, especially around the runtime scheduler.

---

## Planned Rust Structure

Recommended Phase 2 structure:

- `src-tauri/src/main.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/errors.rs`
- `src-tauri/src/state/mod.rs`
- `src-tauri/src/db/mod.rs`
- `src-tauri/src/db/connection.rs`
- `src-tauri/src/db/migrations.rs`
- `src-tauri/src/models/mod.rs`
- `src-tauri/src/models/project.rs`
- `src-tauri/src/models/flow.rs`
- `src-tauri/src/models/project_variable.rs`
- `src-tauri/src/models/prerequisite.rs`
- `src-tauri/src/models/flow_run.rs`
- `src-tauri/src/models/alarm.rs`
- `src-tauri/src/models/flow_state.rs`
- `src-tauri/src/dto/mod.rs`
- `src-tauri/src/dto/project.rs`
- `src-tauri/src/dto/flow.rs`
- `src-tauri/src/dto/project_variable.rs`
- `src-tauri/src/dto/prerequisite.rs`
- `src-tauri/src/repositories/mod.rs`
- `src-tauri/src/repositories/project_repository.rs`
- `src-tauri/src/repositories/flow_repository.rs`
- `src-tauri/src/repositories/project_variable_repository.rs`
- `src-tauri/src/repositories/prerequisite_repository.rs`
- `src-tauri/src/repositories/flow_run_repository.rs`
- `src-tauri/src/repositories/alarm_repository.rs`
- `src-tauri/src/repositories/flow_state_repository.rs`
- `src-tauri/src/scheduler/mod.rs`
- `src-tauri/src/scheduler/events.rs`
- `src-tauri/src/scheduler/runtime.rs`
- `src-tauri/src/scheduler/store.rs`
- `src-tauri/src/scheduler/types.rs`
- `src-tauri/src/commands/mod.rs`
- `src-tauri/src/commands/project_commands.rs`
- `src-tauri/src/commands/flow_commands.rs`
- `src-tauri/src/commands/project_variable_commands.rs`
- `src-tauri/src/commands/prerequisite_commands.rs`

Not every file needs to exist on day one, but this is the intended domain-oriented shape.

Current refactoring direction:
- large React screens are being split into section components to improve local discoverability
- large Rust runtime files are being split into helper modules so orchestration code stays readable
- the justification for these splits is maintenance and crawlability, not architectural churn for its own sake

---

## Backend Layer Responsibilities

### `main.rs`
Responsibility:

- desktop entry point only
- call the shared `run()` function

This file should remain minimal.

### `lib.rs`
Responsibility:

- create the Tauri builder
- initialize the database
- construct shared application state
- register Tauri commands
- register plugins used by the desktop app

`lib.rs` becomes the backend composition root.

### `errors.rs`
Responsibility:

- define shared backend error types
- provide conversion into command-safe error responses

This keeps repositories and commands from inventing their own ad hoc error patterns.

### `state/`
Responsibility:

- define shared application state such as database handles
- expose `AppState` for Tauri command access

Recommended contents:
- database pool or connection manager
- later, scheduler state and runtime handles

This becomes the stable bridge between startup wiring and command handlers.

### `db/`
Responsibility:

- create database connections
- run schema setup or migrations
- centralize low-level persistence bootstrapping

Recommended split:
- `connection.rs` for opening the SQLite connection or pool
- `migrations.rs` for startup migration logic
- `mod.rs` as the public entry point

This keeps SQL bootstrapping separate from business-domain code.

### `models/`
Responsibility:

- define persisted Rust-side domain entities
- represent table-shaped records loaded from SQLite

Examples:
- `Project`
- `Flow`
- `ProjectVariable`
- `Prerequisite`
- `FlowRun`
- `Alarm`
- `FlowState`

These types should stay close to persistence and domain structure.

### `dto/`
Responsibility:

- define request and response shapes for Tauri commands
- separate transport payloads from raw database models when needed

Examples:
- create/update payloads
- frontend-facing response structs
- list-item projections if we do not want to return full DB models

This is useful once the frontend and persistence model stop matching one-to-one.

### `repositories/`
Responsibility:

- own SQL queries and persistence operations
- provide focused CRUD methods by domain

Examples:
- `ProjectRepository`
- `FlowRepository`
- `ProjectVariableRepository`
- `PrerequisiteRepository`

Design rule:
- repositories talk to SQLite
- repositories should not contain Tauri command registration logic

This gives us one place to evolve queries, joins, and persistence behavior.

### `commands/`
Responsibility:

- expose Tauri command functions
- validate command inputs at the boundary
- call repositories or domain services
- map backend errors into frontend-safe responses

Examples:
- `list_projects`
- `create_project`
- `update_project`
- `delete_project`
- `list_flows`
- `create_flow`

Design rule:
- commands are the API boundary
- commands should stay thin and orchestration-focused

---

## Backend Wiring Plan

The intended Phase 2 flow is:

1. `main.rs` starts the desktop binary.
2. `lib.rs` builds the Tauri application.
3. The database layer initializes SQLite and applies migrations.
4. Shared `AppState` is created with the database handle.
5. Tauri commands are registered.
6. The frontend calls commands through `invoke`.
7. Commands delegate to repositories.
8. Repositories read and write SQLite.

At the current Phase 3 slice:

- startup also bootstraps scheduler metadata
- enabled flows are registered with persisted `next_run_at` timestamps
- disabled flows are persisted as paused
- a background scheduler loop scans for due flows
- due flows execute in independent worker threads
- overlap is prevented per flow through an in-memory active-flow registry
- each execution persists a `flow_runs` record and updates `last_run_at` / `next_run_at`

In short:

- startup wiring happens in `lib.rs`
- shared resources live in `state/`
- persistence lives in `db/` and `repositories/`
- command API lives in `commands/`
- domain record definitions live in `models/`

---

## Backend Planning Rules

The intended rules for Phase 2 are:

- `main.rs` stays minimal.
- `lib.rs` is the composition root, not a place for raw SQL.
- schema setup belongs in `db/`, not mixed into command handlers.
- repositories own SQL and persistence logic.
- commands stay thin and frontend-facing.
- shared app resources are accessed through `AppState`.
- scheduling bootstrap belongs in `scheduler/`.
- scheduler scanning and execution coordination also belong in `scheduler/`.
- full runtime execution should still stay separate from repository CRUD modules.

This helps us avoid creating a monolithic `lib.rs` or command layer too early.

---

## Future Production Wiring

### Replace mock data with repository or service layer
Right now pages use:
- shared app state
- mock datasets from `mock-data.ts`

Later this should evolve into:
- backend query layer
- Tauri command integration
- persistence-aware store or repository abstraction

Recommended future direction:
- `services/` or `repositories/` for Tauri/API calls
- shared state loads and mutates entities through those services
- pages remain mostly unchanged

### Separate server state from UI state
Today both are in the same context because this is still a prototype.

For a production version, split into:
- server-backed entity state
- local UI state

Example split:
- entity state: projects, flows, runs, alarms, variables
- UI state: selected project, selected flow, filters, drawer visibility, active section

This would make the data flow cleaner when persistence and async loading are introduced.

### Introduce domain-specific hooks
When the app grows, add hooks such as:
- `useProjects()`
- `useFlows(projectId)`
- `useRuns(flowId)`
- `useAlarms()`
- `useDrawer()`

These hooks can hide query logic and mutations while keeping page components readable.

### Introduce a real routing strategy if needed
Current navigation is local state based because:
- it is simple
- the prototype behaves like a desktop workspace

If the app later needs:
- deep linking
- route persistence
- browser history semantics

then routing can be added without rewriting the whole component structure.

---

## Practical Rules

The intended rules for future work are:

- `App.tsx` should stay a shell, not a page data assembler.
- Shared context should hold base app state and shared UI state, not every computed view detail.
- Each page should derive the data it needs from shared state and data sources.
- Reusable UI components should stay presentation-only.
- Global overlays like the drawer should read shared state directly.
- Reusable confirmation flows should go through the shared confirmation context instead of ad hoc per-screen dialogs.
- Mock data should stay isolated from components.
- Backend integration should replace data sources, not force a structural rewrite of the UI layer.

---

## Summary
The frontend is currently wired as a thin shell over a shared app state provider, with autonomous page components and a reusable UI layer.

That gives us:
- low prop drilling
- clearer ownership
- easier refactoring
- a realistic path from prototype to production

The current architecture is intentionally simple, but it is not throwaway. It is already arranged so that real persistence and backend execution can be introduced in stages instead of requiring a full frontend rewrite.
