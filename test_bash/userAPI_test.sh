#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/common}"
USER_NAME="${TEST_USER_NAME:-testuser_$RANDOM$RANDOM}"
USER_PASSWORD="${TEST_USER_PASSWORD:-Passw0rd!$RANDOM}"

log() {
  printf "\n[%s] %s\n" "$(date -Is)" "$1"
}

urlencode() {
  URLENCODE_INPUT="$1" python3 - <<'PY'
import os, urllib.parse
print(urllib.parse.quote(os.environ["URLENCODE_INPUT"]))
PY
}

json_field() {
  local json_input="$1"
  local key="$2"
  JSON_INPUT="$json_input" KEY_NAME="$key" python3 - <<'PY'
import json, os
payload = json.loads(os.environ["JSON_INPUT"])
key = os.environ["KEY_NAME"]
value = payload.get(key, "")
if value is None:
    value = ""
print(value)
PY
}

log "Registering user '${USER_NAME}'"
register_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${USER_NAME}\",\"password\":\"${USER_PASSWORD}\"}"
)"
echo "Response: ${register_response}"
REGISTER_PUID="$(json_field "${register_response}" "puid")"

log "Fetching PUID for '${USER_NAME}' via lookup API"
encoded_name="$(urlencode "${USER_NAME}")"
puid_lookup_response="$(
  curl -sS -f \
    "${BASE_URL}/user/puid?name=${encoded_name}"
)"
echo "Lookup response: ${puid_lookup_response}"
LOOKUP_PUID="$(json_field "${puid_lookup_response}" "puid")"

if [[ -z "${LOOKUP_PUID}" ]]; then
  echo "[ERROR] Failed to obtain PUID via lookup API." >&2
  exit 1
fi

if [[ -n "${REGISTER_PUID}" && "${LOOKUP_PUID}" != "${REGISTER_PUID}" ]]; then
  echo "[ERROR] PUID mismatch between register and lookup responses." >&2
  exit 1
fi

USER_PUID="${LOOKUP_PUID}"

log "Logging in and requesting long-term token"
login_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/login" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${USER_NAME}\",\"password\":\"${USER_PASSWORD}\",\"longTerm\":true}"
)"
echo "Response: ${login_response}"

ACCESS_TOKEN="$(json_field "${login_response}" "accessToken")"
LONG_TERM_TOKEN="$(json_field "${login_response}" "longTermToken")"

if [[ -z "${LONG_TERM_TOKEN}" ]]; then
  echo "[ERROR] Long-term token was not issued; aborting test." >&2
  exit 1
fi

log "Testing JWT with initial access token"
jwt_response_initial="$(
  curl -sS -f \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${BASE_URL}/user/jwt_test"
)"
echo "JWT test response: ${jwt_response_initial}"

log "Refreshing tokens via long-term token"
refresh_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/refresh_token" \
    -H "Content-Type: application/json" \
    -d "{\"longTermToken\":\"${LONG_TERM_TOKEN}\"}"
)"
echo "Response: ${refresh_response}"

ACCESS_TOKEN="$(json_field "${refresh_response}" "accessToken")"

log "Testing JWT with refreshed access token"
jwt_response_refreshed="$(
  curl -sS -f \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${BASE_URL}/user/jwt_test"
)"
echo "JWT test response: ${jwt_response_refreshed}"

log "Destroying long-term token"
destroy_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/destroy_token" \
    -H "Content-Type: application/json" \
    -d "{\"puid\":\"${USER_PUID}\",\"longTermToken\":\"${LONG_TERM_TOKEN}\"}"
)"
echo "Response: ${destroy_response}"

log "Verifying destroyed long-term token cannot refresh"
tmp_body="$(mktemp)"
set +e
http_code="$(
  curl -sS -o "${tmp_body}" -w "%{http_code}" \
    -X POST \
    "${BASE_URL}/user/refresh_token" \
    -H "Content-Type: application/json" \
    -d "{\"longTermToken\":\"${LONG_TERM_TOKEN}\"}"
)"
set -e
echo "Response body: $(cat "${tmp_body}")"
rm -f "${tmp_body}"

if [[ "${http_code}" == "200" ]]; then
  echo "[ERROR] Refresh succeeded after destroying long-term token." >&2
  exit 1
fi

echo "HTTP status after destroy: ${http_code}"
log "Test flow completed successfully."
