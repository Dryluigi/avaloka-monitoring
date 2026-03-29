#!/usr/bin/env bash

set -u

TARGET_IP="10.8.0.1"

if ! command -v ping >/dev/null 2>&1; then
  echo "ping is not installed or not available in PATH" >&2
  exit 127
fi

if ping -c 1 -W 5 "${TARGET_IP}" >/dev/null 2>&1; then
  echo "Host ${TARGET_IP} responded to ping"
  exit 0
fi

echo "Host ${TARGET_IP} did not respond to ping" >&2
exit 1
