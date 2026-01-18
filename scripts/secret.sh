#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_SECRET_FILE="${ROOT_DIR}/secret.yaml"
ALT_SECRET_FILE="${ROOT_DIR}/secret.yml"
FALLBACK_SECRET_FILE="${ROOT_DIR}/secret.txt"
SECRET_FILE="${SECRET_FILE:-}"

# secretファイルの決定
if [[ -z "${SECRET_FILE}" ]]; then
  if [[ -f "${DEFAULT_SECRET_FILE}" ]]; then
    SECRET_FILE="${DEFAULT_SECRET_FILE}"
  elif [[ -f "${ALT_SECRET_FILE}" ]]; then
    SECRET_FILE="${ALT_SECRET_FILE}"
  elif [[ -f "${FALLBACK_SECRET_FILE}" ]]; then
    SECRET_FILE="${FALLBACK_SECRET_FILE}"
  fi
fi

if [[ -z "${SECRET_FILE}" || ! -f "${SECRET_FILE}" ]]; then
  echo "[ERROR] secret file not found. Place secret.yaml (or secret.yml/secret.txt) in repo root or set SECRET_FILE=... ." >&2
  exit 1
fi

python3 - "$ROOT_DIR" "$SECRET_FILE" <<'PY'
import os
import sys
from pathlib import Path

root = Path(sys.argv[1])
secret_path = Path(sys.argv[2])

TARGETS = {
    "common": root / "backends/common/.env.development",
    "frontend": root / "frontend/.env.local",
}

def load_secrets(path: Path):
    # 1) try yaml
    try:
        import yaml  # type: ignore
        with path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # 2) minimal parser: section/key: value or key=value (common)
    data: dict[str, dict[str, str]] = {}
    current = None
    with path.open("r", encoding="utf-8") as f:
        for raw in f:
            line = raw.split("#", 1)[0].rstrip("\n")
            if not line.strip():
                continue
            if not line.startswith((" ", "\t")) and line.endswith(":"):
                current = line[:-1].strip()
                data.setdefault(current, {})
                continue
            if current and line.startswith((" ", "\t")) and ":" in line:
                key, val = line.strip().split(":", 1)
                key = key.strip()
                val = val.strip().strip("'").strip('"')
                data[current][key] = val
            elif "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'").strip('"')
                data.setdefault("common", {})[key] = val
    return data

def normalize(value):
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)

secrets = load_secrets(secret_path)
if not isinstance(secrets, dict):
    sys.exit("[ERROR] secret file is not a mapping")

for section, kvs in secrets.items():
    if section not in TARGETS:
        continue
    if not isinstance(kvs, dict):
        continue
    lines = []
    for k, v in kvs.items():
        lines.append(f"{k}={normalize(v)}")
    target = TARGETS[section]
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8") as f:
        f.write("\n".join(lines))
        if lines:
            f.write("\n")

print(f"[INFO] env files generated from {secret_path}")
PY
