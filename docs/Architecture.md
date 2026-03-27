# Frontend Architecture

## Overview
The current frontend is structured as a small desktop-style React application with a clear separation between:

- app shell and navigation
- shared app state
- page-level views
- reusable UI primitives
- mock data and frontend-only configuration

The main design goal is to keep the app easy to evolve from prototype into a real product without rewriting the entire frontend structure.

---

## Current Structure

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
- `src/prototype/AppStateContext.tsx`

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

This is currently a practical app-level state store for the prototype.

---

### Page views
Files:
- `src/components/DashboardView.tsx`
- `src/components/ProjectsView.tsx`
- `src/components/RunsView.tsx`
- `src/components/AlarmsView.tsx`

Responsibility:
- own the display logic for one top-level page
- derive page-specific data from shared app state and mock data
- trigger actions by updating shared app state

Examples:
- `DashboardView` reads flows from app state and combines them with mock runs and alarms to derive summary cards, failing items, and upcoming items.
- `ProjectsView` is responsible for selecting project-specific variables, project alarms, flow runs, flow state, and filtered flow lists.
- `RunsView` owns run pagination.
- `AlarmsView` owns alarm list presentation.

Design rule:
- page components should own page-specific data shaping
- `App.tsx` should not assemble page payloads for them

This keeps each page more autonomous and reduces coupling with the shell.

---

### Drawer
File:
- `src/components/Drawer.tsx`

Responsibility:
- render create/edit forms for project, flow, variable, and prerequisite
- read the current drawer state from shared app state
- update shared state directly on save

Why drawer is global:
- it behaves like an app-level overlay
- it may be triggered from different pages
- centralizing it avoids duplicate modal logic in each page

The drawer is part of the app shell layer, but the form behavior is still self-contained inside the component.

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

### Mock data and app metadata
Files:
- `src/prototype/mock-data.ts`
- `src/prototype/config.ts`
- `src/prototype/types.ts`

Responsibility:
- define the frontend-only data model
- provide stable mock datasets
- provide shared constants like navigation items and status display metadata

This separation matters because it lets us later replace the source of truth without rewriting the UI structure.

---

## Wiring Strategy

### 1. App shell owns only shell concerns
`App.tsx` is responsible for:
- current section
- mobile navigation open/close
- topbar behavior
- page switching
- global overlay mounting

It is not responsible for:
- dashboard-specific calculations
- project filtering logic
- run pagination
- alarm list shaping

That logic now lives closer to the page that uses it.

### 2. Shared state is centralized
Interactive data used by multiple screens lives in `AppStateContext`.

This includes:
- editable project and flow data
- current selected project and flow
- filter state
- drawer state

This is the minimum shared layer needed to avoid excessive prop passing.

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

That means we can replace mock data incrementally without restructuring every screen.

---

## Architecture Planning

## Near-term plan

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

---

## Future production wiring

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
