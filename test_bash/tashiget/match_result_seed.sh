#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/common}"
OWNER_NAME="${OWNER_NAME:-admin}"
OWNER_PASSWORD="${OWNER_PASSWORD:-42admin}"
OWNER_EMAIL="${OWNER_EMAIL:-admin@example.com}"
GUEST_NAME="${GUEST_NAME:-guest}"

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

log "adminでログイン"
login_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${OWNER_EMAIL}\",\"password\":\"${OWNER_PASSWORD}\"}"
)"
ACCESS_TOKEN="$(json_field "${login_response}" "accessToken")"
if [[ -z "${ACCESS_TOKEN}" ]]; then
  echo "[ERROR] accessTokenが取得できませんでした" >&2
  exit 1
fi

log "guestのPUIDを取得"
GUEST_PUID_RESPONSE="$(
  curl -sS -f \
    "${BASE_URL}/user/puid?name=${GUEST_NAME}"
)"
GUEST_PUID="$(json_field "${GUEST_PUID_RESPONSE}" "puid")"
if [[ -z "${GUEST_PUID}" ]]; then
  echo "[ERROR] guestのPUIDが取得できませんでした" >&2
  exit 1
fi

log "guestとの対戦セッション作成"
match_session_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/match_session" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"guestPuid\":\"${GUEST_PUID}\"}"
)"
MATCH_ID_GUEST="$(json_field "${match_session_response}" "id")"
if [[ -z "${MATCH_ID_GUEST}" ]]; then
  echo "[ERROR] match_session(id)が取得できませんでした" >&2
  exit 1
fi

log "guestとの対戦結果を保存"
result_response_guest="$(
  curl -sS -f -X POST \
    "${BASE_URL}/match_result" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"matchId\":${MATCH_ID_GUEST},\"ownerScore\":3,\"guestScore\":2}"
)"
echo "Guest match result: ${result_response_guest}"

log "AIとの対戦セッション作成"
match_session_ai_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/match_session" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{}"
)"
MATCH_ID_AI="$(json_field "${match_session_ai_response}" "id")"
if [[ -z "${MATCH_ID_AI}" ]]; then
  echo "[ERROR] AI match_session(id)が取得できませんでした" >&2
  exit 1
fi

log "AIとの対戦結果を保存"
result_response_ai="$(
  curl -sS -f -X POST \
    "${BASE_URL}/match_result" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"matchId\":${MATCH_ID_AI},\"ownerScore\":5,\"guestScore\":1}"
)"
echo "AI match result: ${result_response_ai}"

log "試合結果の登録が完了しました"
