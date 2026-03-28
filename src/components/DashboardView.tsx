import { useMemo } from "react";

import { STATUS_META } from "../lib/config";
import {
  MOCK_ACTIVE_EXECUTIONS,
  MOCK_ALARMS,
  MOCK_RUNS,
} from "../data/mock-data";
import { useAppState } from "../state/AppStateContext";
import type { AppSection } from "../types/app";
import { ActionButton } from "./ui/buttons";
import { CardSection } from "./ui/layout";
import { Metric, MetricPanel, StatCard } from "./ui/metrics";
import { SmallEmptyState, StatusPill } from "./ui/status";

export function DashboardView(props: {
  onNavigate: (section: AppSection) => void;
}) {
  const { onNavigate } = props;
  const { projects, flows } = useAppState();

  const activeExecutions = MOCK_ACTIVE_EXECUTIONS;
  const alarms = MOCK_ALARMS;

  const failingRuns = useMemo(
    () =>
      MOCK_RUNS.filter((run) => run.failureMessage).sort((left, right) =>
        right.startedAt.localeCompare(left.startedAt),
      ),
    [],
  );

  const upcomingFlows = useMemo(
    () =>
      flows
        .filter((flow) => flow.enabled && flow.nextRunAt !== "Paused")
        .sort((left, right) => left.nextRunAt.localeCompare(right.nextRunAt))
        .slice(0, 4),
    [flows],
  );

  const summary = useMemo(
    () => ({
      totalFlows: flows.length,
      activeExecutions: activeExecutions.length,
      failingFlows: flows.filter(
        (flow) =>
          flow.status === "failed" ||
          flow.status === "prerequisite_failed" ||
          flow.status === "timed_out",
      ).length,
      nextExecution: upcomingFlows[0]?.nextRunAt ?? "No upcoming run",
    }),
    [activeExecutions.length, flows, upcomingFlows],
  );

  return (
    <div className="h-full space-y-6 overflow-y-auto pr-1">
      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              One-look execution dashboard
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              See what is currently executing, what will run next, what is
              failing, and the latest failure messages without leaving the page.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onNavigate("projects")}>
              Open projects
            </ActionButton>
            <ActionButton onClick={() => onNavigate("runs")}>
              Open runs
            </ActionButton>
            <ActionButton onClick={() => onNavigate("alarms")}>
              Open alarms
            </ActionButton>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total flows"
            value={String(summary.totalFlows)}
            tone="blue"
          />
          <StatCard
            label="Currently executing"
            value={String(summary.activeExecutions)}
            tone="teal"
          />
          <StatCard
            label="Failing flows"
            value={String(summary.failingFlows)}
            tone="rose"
          />
          <StatCard
            label="Next execution"
            value={summary.nextExecution}
            tone="amber"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CardSection
          title="Currently executing"
          description="Flows that are in progress right now, including whether they are in a prerequisite or main execution stage."
        >
          {activeExecutions.length === 0 ? (
            <SmallEmptyState label="No active flow execution right now." />
          ) : (
            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1 pb-3">
              {activeExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {execution.projectName}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {execution.flowName}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {execution.note}
                      </p>
                    </div>

                    <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                      <Metric
                        label="Stage"
                        value={execution.stage}
                        tone={execution.stage === "main" ? "blue" : "teal"}
                      />
                      <Metric
                        label="Started"
                        value={execution.startedAt}
                        tone="slate"
                      />
                      <Metric
                        label="Elapsed"
                        value={execution.elapsedLabel}
                        tone="amber"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardSection>

        <CardSection
          title="What will run next"
          description="Upcoming scheduled executions ordered by the mock next-run time."
        >
          {upcomingFlows.length === 0 ? (
            <SmallEmptyState label="No upcoming executions are scheduled." />
          ) : (
            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1 pb-3">
              {upcomingFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {flow.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {flow.intervalLabel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {flow.nextRunAt}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {flow.lastRunAt}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardSection>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <CardSection
          title="Failing now"
          description="Failure states with the actual failure message shown directly in the dashboard."
        >
          {failingRuns.length === 0 ? (
            <SmallEmptyState label="No failing runs are available right now." />
          ) : (
            <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1 pb-3">
              {failingRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={run.status}>
                      {STATUS_META[run.status].label}
                    </StatusPill>
                    <span className="text-sm font-medium text-slate-900">
                      {run.flowName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {run.projectName}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {run.summary}
                  </p>
                  <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    {run.failureMessage}
                  </div>
                  <div className="mt-3 text-xs text-slate-400">
                    {run.startedAt} • {run.durationLabel}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardSection>

        <div className="space-y-6">
          <CardSection
            title="Alarm stream"
            description="Latest desktop alarm payloads visible without opening the alarm page."
          >
            {alarms.length === 0 ? (
              <SmallEmptyState label="No alarms to show." />
            ) : (
              <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-1 pb-3">
                {alarms.slice(0, 4).map((alarm) => (
                  <div
                    key={alarm.id}
                    className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-900">
                        {alarm.flowName}
                      </div>
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[11px] font-medium",
                          alarm.severity === "critical"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        {alarm.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {alarm.message}
                    </p>
                    <div className="mt-2 text-xs text-slate-400">
                      {alarm.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardSection>

          <CardSection
            title="Coverage snapshot"
            description="Prototype-wide counts to help validate one-look density."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricPanel
                label="Projects"
                value={String(projects.length)}
                tone="blue"
              />
              <MetricPanel
                label="Flows"
                value={String(flows.length)}
                tone="teal"
              />
              <MetricPanel
                label="Failing messages"
                value={String(failingRuns.length)}
                tone="rose"
              />
              <MetricPanel
                label="Open alarms"
                value={String(alarms.length)}
                tone="amber"
              />
            </div>
          </CardSection>
        </div>
      </section>
    </div>
  );
}
