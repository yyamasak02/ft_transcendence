#!/usr/bin/env python3
import argparse
import base64
import hmac
import struct
import sys
import time


def _clean_secret(secret: str) -> str:
    return "".join(secret.strip().split()).upper()


def _decode_base32(secret: str) -> bytes:
    padded = secret + "=" * ((8 - len(secret) % 8) % 8)
    return base64.b32decode(padded, casefold=True)


def _totp(secret_bytes: bytes, step: int = 30, digits: int = 6) -> str:
    counter = int(time.time() // step)
    msg = struct.pack(">Q", counter)
    digest = hmac.new(secret_bytes, msg, "sha1").digest()
    offset = digest[-1] & 0x0F
    code = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(code % (10 ** digits)).zfill(digits)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a 6-digit TOTP code.")
    parser.add_argument("--secret", help="Base32-encoded secret (optional).")
    args = parser.parse_args()

    secret = args.secret
    if not secret:
        secret = input("Secret (base32): ")

    secret = _clean_secret(secret)
    if not secret:
        print("Error: empty secret.", file=sys.stderr)
        return 1

    try:
        secret_bytes = _decode_base32(secret)
    except Exception as exc:
        print(f"Error: invalid base32 secret ({exc}).", file=sys.stderr)
        return 1

    print(_totp(secret_bytes))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
