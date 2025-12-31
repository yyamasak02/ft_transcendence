#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/common}"
ID_TOKEN="${GOOGLE_ID_TOKEN:-}"
REQUEST_LONG_TERM="${GOOGLE_LONG_TERM:-true}"
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
  }
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

jwt_payload_field() {
  local jwt="$1"
  local key="$2"
  JWT_INPUT="$jwt" KEY_NAME="$key" python3 - <<'PY'
import base64, json, os

jwt_input = os.environ["JWT_INPUT"]
key = os.environ["KEY_NAME"]

try:
    parts = jwt_input.split(".")
    if len(parts) < 2:
        raise ValueError("Invalid JWT")
    payload_b64 = parts[1]
    padding = "=" * ((4 - len(payload_b64) % 4) % 4)
    decoded = base64.urlsafe_b64decode(payload_b64 + padding)
    payload = json.loads(decoded)
    value = payload.get(key, "")
    if value is None:
        value = ""
    print(value)
except Exception as e:
    print("", end="")
PY
}

if [[ -z "${ID_TOKEN}" ]]; then
  fail "環境変数 GOOGLE_ID_TOKEN に有効な Google ID トークンを設定してください。"
fi

if [[ "${REQUEST_LONG_TERM}" != "true" && "${REQUEST_LONG_TERM}" != "false" ]]; then
  fail "GOOGLE_LONG_TERM は true/false のいずれかで指定してください。"
fi

log "Google ID トークンでログイン（longTerm=${REQUEST_LONG_TERM})"
login_response="$(
  curl -sS -f -X POST \
    "${BASE_URL}/user/google_login" \
    -H "Content-Type: application/json" \
    -d "{\"idToken\":\"${ID_TOKEN}\",\"longTerm\":${REQUEST_LONG_TERM}}"
)"
echo "Response: ${login_response}"

ACCESS_TOKEN="$(json_field "${login_response}" "accessToken")"
LONG_TERM_TOKEN="$(json_field "${login_response}" "longTermToken")"

if [[ -z "${ACCESS_TOKEN}" ]]; then
  fail "アクセス トークンが返却されませんでした。"
fi

if [[ "${REQUEST_LONG_TERM}" == "true" && -z "${LONG_TERM_TOKEN}" ]]; then
  fail "longTerm=true なのに longTermToken が返却されませんでした。"
fi

USER_PUID="$(jwt_payload_field "${ACCESS_TOKEN}" "puid")"
if [[ -z "${USER_PUID}" ]]; then
  fail "アクセストークンから puid を取得できませんでした。"
fi

log "JWT 検証APIでアクセストークンが有効であることを確認"
jwt_response="$(
  curl -sS -f \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${BASE_URL}/user/jwt_test"
)"
echo "JWT test response: ${jwt_response}"

if [[ "${REQUEST_LONG_TERM}" == "true" ]]; then
  log "長期トークンでアクセストークンを再発行"
  refresh_response="$(
    curl -sS -f -X POST \
      "${BASE_URL}/user/refresh_token" \
      -H "Content-Type: application/json" \
      -d "{\"longTermToken\":\"${LONG_TERM_TOKEN}\"}"
  )"
  echo "Refresh response: ${refresh_response}"

  ACCESS_TOKEN="$(json_field "${refresh_response}" "accessToken")"
  if [[ -z "${ACCESS_TOKEN}" ]]; then
    fail "リフレッシュ後のアクセストークンが空です。"
  fi

  log "再発行したアクセストークンでJWT検証"
  jwt_response_refreshed="$(
    curl -sS -f \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      "${BASE_URL}/user/jwt_test"
  )"
  echo "JWT test (refreshed) response: ${jwt_response_refreshed}"

  log "長期トークンを破棄"
  destroy_response="$(
    curl -sS -f -X POST \
      "${BASE_URL}/user/destroy_token" \
      -H "Content-Type: application/json" \
      -d "{\"puid\":\"${USER_PUID}\",\"longTermToken\":\"${LONG_TERM_TOKEN}\"}"
  )"
  echo "Destroy response: ${destroy_response}"

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
fi

log "Google ログインテスト完了"
