#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/common}"
USER_NAME="${TEST_USER_NAME:-testuser_$RANDOM$RANDOM}"
USER_PASSWORD="${TEST_USER_PASSWORD:-Passw0rd!$RANDOM}"

log() {
  printf "\n[%s] %s\n" "$(date -Is)" "$1"
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

log "Logging in and requesting long-term token"
login_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/login" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${USER_NAME}\",\"password\":\"${USER_PASSWORD}\",\"longTerm\":true}"
)"
echo "Response: ${login_response}"

USER_ID="$(json_field "${login_response}" "id")"
ACCESS_TOKEN="$(json_field "${login_response}" "accessToken")"
REFRESH_TOKEN="$(json_field "${login_response}" "refreshToken")"
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
REFRESH_TOKEN="$(json_field "${refresh_response}" "refreshToken")"

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
    -d "{\"userId\":${USER_ID},\"longTermToken\":\"${LONG_TERM_TOKEN}\"}"
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
