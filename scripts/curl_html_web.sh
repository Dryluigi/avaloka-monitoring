#!/usr/bin/env bash

set -u

URL="${WEBSITE_URL:-${1:-}}"
TIMEOUT_SECONDS=30

if [[ -z "${URL}" ]]; then
  echo "Missing URL. Set WEBSITE_URL or pass <url>." >&2
  exit 2
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is not installed or not available in PATH" >&2
  exit 127
fi

TMP_OUTPUT="$(mktemp)"
trap 'rm -f "$TMP_OUTPUT"' EXIT

# Perform request
HTTP_CODE=""
CONTENT_TYPE=""
TOTAL_TIME=""

RESPONSE=$(curl -sS -L \
  --max-time "${TIMEOUT_SECONDS}" \
  -w "\n%{http_code} %{content_type} %{time_total}" \
  -o "$TMP_OUTPUT" \
  "$URL" 2>&1)

EXIT_CODE=$?

if [[ "${EXIT_CODE}" -ne 0 ]]; then
  if [[ "${EXIT_CODE}" -eq 28 ]]; then
    echo "Timed out after ${TIMEOUT_SECONDS}s while requesting ${URL}" >&2
  else
    echo "Curl failed for ${URL}: ${RESPONSE}" >&2
  fi
  exit 1
fi

# Extract last line (metadata)
META_LINE="$(echo "$RESPONSE" | tail -n1)"
HTTP_CODE="$(echo "$META_LINE" | awk '{print $1}')"
CONTENT_TYPE="$(echo "$META_LINE" | awk '{print $2}')"
TOTAL_TIME="$(echo "$META_LINE" | awk '{print $3}')"

# Normalize content type check
if [[ "${HTTP_CODE}" == "200" && "${CONTENT_TYPE}" == *"text/html"* ]]; then
  echo "SUCCESS: ${URL}"
  echo "Status: ${HTTP_CODE}"
  echo "Content-Type: ${CONTENT_TYPE}"
  echo "Response Time: ${TOTAL_TIME}s"
  exit 0
fi

# Error output
echo "FAILED: ${URL}" >&2
echo "Status: ${HTTP_CODE}" >&2
echo "Content-Type: ${CONTENT_TYPE}" >&2
echo "Response Time: ${TOTAL_TIME}s" >&2

# Optional: include snippet of response body for debugging
BODY_PREVIEW="$(head -c 200 "$TMP_OUTPUT" | tr '\n' ' ')"
if [[ -n "${BODY_PREVIEW}" ]]; then
  echo "Response Preview: ${BODY_PREVIEW}" >&2
fi

exit 1