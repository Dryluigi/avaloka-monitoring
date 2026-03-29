export function formatSecondsBreakdown(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "";
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(days === 1 ? "1 day" : `${days} days`);
  }

  if (hours > 0) {
    parts.push(hours === 1 ? "1 hour" : `${hours} hours`);
  }

  if (minutes > 0) {
    parts.push(minutes === 1 ? "1 minute" : `${minutes} minutes`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(seconds === 1 ? "1 second" : `${seconds} seconds`);
  }

  return parts.join(", ");
}

export function parseIntervalLabelToSeconds(intervalLabel: string) {
  const normalized = intervalLabel.trim().toLowerCase();
  const match = normalized.match(
    /every\s+(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours)/,
  );

  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (unit.startsWith("hr") || unit.startsWith("hour")) {
    return value * 3600;
  }

  if (unit.startsWith("min") || unit.startsWith("minute")) {
    return value * 60;
  }

  return value;
}

export function formatScheduleTimestamp(value: string) {
  if (
    value === "Paused" ||
    value === "Pending schedule" ||
    value === "Not yet" ||
    !value
  ) {
    return value;
  }

  const parsed = new Date(value.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
