function isRuntimeMetadataLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("STATE:")) {
    return true;
  }

  return /^[A-Z_][A-Z0-9_]*=.*/.test(trimmed);
}

export function formatUserFacingRunSummary(summary: string) {
  const lines = summary
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const visibleLines = lines.filter((line) => !isRuntimeMetadataLine(line));

  if (visibleLines.length > 0) {
    return visibleLines.join(" ");
  }

  const compact = summary.trim().replace(/\s+/g, " ");

  if (!compact) {
    return "Run completed.";
  }

  return compact;
}
