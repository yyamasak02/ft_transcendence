#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/common}"
USER_NAME="${TEST_USER_NAME:-testuser_$RANDOM$RANDOM}"
USER_PASSWORD="${TEST_USER_PASSWORD:-Passw0rd!$RANDOM}"
USER_EMAIL="${TEST_USER_EMAIL:-${USER_NAME}@example.com}"
ALL_TESTS_PASSED=true

handle_err() {
  ALL_TESTS_PASSED=false
}
trap handle_err ERR

finish() {
  if [[ "${ALL_TESTS_PASSED}" == true ]]; then
    echo "[OK] 全てのテストが成功しました。"
  else
    echo "[NG] テストで失敗が発生しました。" >&2
  fi
}
trap finish EXIT

fail() {
  local message="$1"
  echo "[ERROR] ${message}" >&2
  ALL_TESTS_PASSED=false
  exit 1
}

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

log "ユーザー'${USER_NAME}'を登録中"
register_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_EMAIL}\",\"name\":\"${USER_NAME}\",\"password\":\"${USER_PASSWORD}\"}"
)"
echo "Response: ${register_response}"

log "同じユーザー名の登録が失敗することを確認"
dup_body="$(mktemp)"
set +e
dup_status="$(
  curl -sS -o "${dup_body}" -w "%{http_code}" \
    -X POST \
    "${BASE_URL}/user/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${USER_NAME}\",\"password\":\"${USER_PASSWORD}\"}"
)"
set -e
echo "Duplicate response body: $(cat "${dup_body}")"
rm -f "${dup_body}"
if [[ "${dup_status}" -ne 409 ]]; then
  fail "重複ユーザー名の登録が409になりませんでした (status: ${dup_status})。"
fi

log "ユーザー'${USER_NAME}'のPUIDを照会APIで取得中"
encoded_name="$(urlencode "${USER_NAME}")"
puid_lookup_response="$(
  curl -sS -f \
    "${BASE_URL}/user/puid?name=${encoded_name}"
)"
echo "Lookup response: ${puid_lookup_response}"
LOOKUP_PUID="$(json_field "${puid_lookup_response}" "puid")"

if [[ -z "${LOOKUP_PUID}" ]]; then
  fail "PUIDの取得に失敗しました。"
fi

USER_PUID="${LOOKUP_PUID}"

log "ログインして長期トークンを要求中"
login_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_EMAIL}\",\"password\":\"${USER_PASSWORD}\",\"longTerm\":true}"
)"
echo "Response: ${login_response}"

ACCESS_TOKEN="$(json_field "${login_response}" "accessToken")"
LONG_TERM_TOKEN="$(json_field "${login_response}" "longTermToken")"

if [[ -z "${LONG_TERM_TOKEN}" ]]; then
  fail "長期トークンが発行されなかったためテストを中断します。"
fi

log "初回発行したアクセストークンでJWT検証を実行"
jwt_response_initial="$(
  curl -sS -f \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${BASE_URL}/user/jwt_test"
)"
echo "JWT test response: ${jwt_response_initial}"

log "無効なアクセストークンでJWT検証が失敗することを確認"
invalid_jwt_body="$(mktemp)"
set +e
invalid_jwt_status="$(
  curl -sS -o "${invalid_jwt_body}" -w "%{http_code}" \
    -H "Authorization: Bearer invalid.jwt.token" \
    "${BASE_URL}/user/jwt_test"
)"
set -e
echo "Invalid JWT response body: $(cat "${invalid_jwt_body}")"
rm -f "${invalid_jwt_body}"

if [[ "${invalid_jwt_status}" -ne 401 ]]; then
  fail "無効なJWTでのアクセスが想定どおり401になりませんでした (status: ${invalid_jwt_status})。"
fi

log "長期トークンを使ってアクセストークンを再発行"
refresh_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/refresh_token" \
    -H "Content-Type: application/json" \
    -d "{\"longTermToken\":\"${LONG_TERM_TOKEN}\"}"
)"
echo "Response: ${refresh_response}"

ACCESS_TOKEN="$(json_field "${refresh_response}" "accessToken")"

log "再発行したアクセストークンでJWT検証を実行"
jwt_response_refreshed="$(
  curl -sS -f \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${BASE_URL}/user/jwt_test"
)"
echo "JWT test response: ${jwt_response_refreshed}"

log "長期トークンを破棄"
destroy_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/destroy_token" \
    -H "Content-Type: application/json" \
    -d "{\"puid\":\"${USER_PUID}\",\"longTermToken\":\"${LONG_TERM_TOKEN}\"}"
)"
echo "Response: ${destroy_response}"

log "破棄済み長期トークンで再発行できないことを確認"
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
  fail "破棄後の長期トークンで再発行に成功しました。"
fi

echo "HTTP status after destroy: ${http_code}"
log "テストフローが正常に完了しました"
