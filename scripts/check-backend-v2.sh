#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${VITE_API_BASE_URL:-https://backend.linka.su}"
DEVICE_ID="device_check_$(date +%s)"

red() { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[33m%s\033[0m\n' "$1"; }

check_status() {
  local path="$1"
  local expected_prefix="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" || true)
  if [[ "$code" == "$expected_prefix"* ]]; then
    green "OK   $path -> $code"
  else
    yellow "WARN $path -> $code (expected ${expected_prefix}xx)"
  fi
}

echo "Checking backend at: $BASE_URL"
check_status "/health" "2"
check_status "/v2/health" "2"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/v2/devices/register" \
  -H 'Content-Type: application/json' \
  -H 'X-Client-Type: electron' \
  -d "{\"device_id\":\"$DEVICE_ID\",\"platform\":\"electron\"}" || true)

API_KEY=$(printf "%s" "$REGISTER_RESPONSE" | sed -n 's/.*"api_key"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

if [[ -n "$API_KEY" ]]; then
  green "OK   /v2/devices/register returned api_key"
else
  yellow "WARN /v2/devices/register did not return api_key"
  echo "Response: $REGISTER_RESPONSE"
fi

if [[ -n "$API_KEY" ]]; then
  for path in \
    "/v2/categories" \
    "/v2/quickes" \
    "/v2/user/state"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" \
      -H "X-Api-Key: $API_KEY" \
      -H "X-Device-Id: $DEVICE_ID" \
      -H "X-Client-Type: electron" || true)
    if [[ "$code" == 2* || "$code" == 4* ]]; then
      green "OK   $path -> $code"
    else
      yellow "WARN $path -> $code"
    fi
  done
fi
