import { useAppState } from "../state/AppStateContext";
import { StatCard } from "./ui/metrics";
import { EmptyState } from "./ui/status";

export function AlarmsView() {
  const { alarms } = useAppState();

  return (
    <div className="h-full space-y-6 overflow-y-auto pr-1">
      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Alarm center
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Desktop notification preview with concise failure context and a
              calmer, non-noisy layout.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Open alarms" value={String(alarms.length)} />
            <StatCard
              label="Critical"
              value={String(
                alarms.filter((alarm) => alarm.severity === "critical").length,
              )}
            />
          </div>
        </div>
      </section>

      {alarms.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--panel)] p-10">
          <EmptyState
            title="No alarms"
            body="The prototype currently has no alarms to display."
          />
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {alarms.map((alarm) => (
            <div
              key={alarm.id}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {alarm.projectName}
                  </div>
                  <h4 className="mt-2 text-lg font-semibold text-slate-950">
                    {alarm.flowName}
                  </h4>
                </div>
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    alarm.severity === "critical"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-amber-50 text-amber-700",
                  ].join(" ")}
                >
                  {alarm.severity}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {alarm.message}
              </p>
              <div className="mt-4 text-xs text-slate-400">
                {alarm.createdAt}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
