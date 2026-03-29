#!/usr/bin/env bash

set -u

HOST="${1:-}"
PORT="${2:-22}"
TIMEOUT_SECONDS=30

if [[ -z "${HOST}" ]]; then
  echo "Usage: $0 <host> [port]" >&2
  exit 2
fi

if ! command -v telnet >/dev/null 2>&1; then
  echo "telnet is not installed or not available in PATH" >&2
  exit 127
fi

TMP_OUTPUT="$(mktemp)"
trap 'rm -f "$TMP_OUTPUT"' EXIT

if timeout "${TIMEOUT_SECONDS}s" telnet "${HOST}" "${PORT}" >"$TMP_OUTPUT" 2>&1; then
  echo "SSH port ${PORT} is reachable on ${HOST}"
  exit 0
fi

EXIT_CODE=$?
OUTPUT="$(tr '\n' ' ' <"$TMP_OUTPUT" | sed 's/[[:space:]]\+/ /g; s/^ //; s/ $//')"

if [[ "${EXIT_CODE}" -eq 124 ]]; then
  echo "Timed out after ${TIMEOUT_SECONDS}s while connecting to ${HOST}:${PORT}" >&2
  exit 1
fi

if [[ -n "${OUTPUT}" ]]; then
  echo "Failed to connect to ${HOST}:${PORT}: ${OUTPUT}" >&2
else
  echo "Failed to connect to ${HOST}:${PORT}" >&2
fi

exit 1
