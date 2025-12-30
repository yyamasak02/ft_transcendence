import argon2 from "argon2";
import { createHash, createHmac, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { AccessTokenPayload, TwoFactorTokenPayload } from "../types/jwt.js";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const LONG_TERM_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const TWO_FACTOR_TOKEN_EXPIRES_IN = "5m";

export type StoredUser = {
  id: number;
  puid: string;
  name: string;
  password: string;
  salt: string;
};

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
} as const;

function legacyHashPassword(password: string, salt: string) {
  return createHash("sha256").update(password + salt).digest("hex");
}

function isArgonHash(hash: string) {
  return hash.startsWith("$argon2");
}

export async function hashPassword(password: string, salt: string) {
  return argon2.hash(password, {
    ...ARGON2_OPTIONS,
    salt: Buffer.from(salt, "hex"),
  });
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generatePuid() {
  const entropy = randomBytes(32).toString("hex");
  return createHash("sha256").update(entropy).digest("hex");
}

export const MAX_PUID_GENERATION_RETRIES = 5;

// RFC 4648 Base32 alphabet (A-Z, 2-7)
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DEFAULT_TOTP_SECRET_LENGTH = 24;

export function generateTotpSecret(length = DEFAULT_TOTP_SECRET_LENGTH) {
  const bytes = randomBytes(length);
  let output = "";
  for (const byte of bytes) {
    output += BASE32_ALPHABET[byte % BASE32_ALPHABET.length];
  }
  return output;
}

export async function issueTokens(
  fastify: FastifyInstance,
  user: { id: number; puid: string; name: string },
) {
  const accessToken = fastify.jwt.sign(
    {
      userId: user.id,
      puid: user.puid,
      name: user.name,
      type: "access",
    } satisfies AccessTokenPayload,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );
  return { accessToken };
}

export async function issueTwoFactorToken(
  fastify: FastifyInstance,
  userId: number,
) {
  return fastify.jwt.sign(
    {
      userId,
      type: "2fa",
    } satisfies TwoFactorTokenPayload,
    { expiresIn: TWO_FACTOR_TOKEN_EXPIRES_IN },
  );
}

export async function issueLongTermToken(
  fastify: FastifyInstance,
  userId: number,
) {
  const rawToken = randomBytes(48).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + LONG_TERM_TOKEN_TTL_MS);

  await fastify.db.run(
    "INSERT INTO long_term_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    tokenHash,
    userId,
    expiresAt.toISOString(),
  );

  return { token: rawToken, expiresAt };
}

export async function verifyLongTermToken(
  fastify: FastifyInstance,
  token: string,
) {
  const tokenHash = hashToken(token);
  const record = await fastify.db.get<{
    user_id: number;
    expires_at: string | null;
  }>(
    "SELECT user_id, expires_at FROM long_term_tokens WHERE token_hash = ?",
    tokenHash,
  );

  if (!record) {
    return null;
  }

  if (record.expires_at && Date.parse(record.expires_at) <= Date.now()) {
    await fastify.db.run(
      "DELETE FROM long_term_tokens WHERE token_hash = ?",
      tokenHash,
    );
    return null;
  }

  return { userId: record.user_id };
}

export async function removeLongTermToken(
  fastify: FastifyInstance,
  token: string,
) {
  await fastify.db.run(
    "DELETE FROM long_term_tokens WHERE token_hash = ?",
    hashToken(token),
  );
}

export async function findUserByName(
  fastify: FastifyInstance,
  name: string,
) {
  return fastify.db.get<StoredUser>(
    "SELECT id, puid, name, password, salt FROM users WHERE name = ?",
    name,
  );
}

export async function findUserByGoogleSub(
  fastify: FastifyInstance,
  googleSub: string,
) {
  return fastify.db.get<StoredUser>(
    `SELECT users.id, users.puid, users.name, users.password, users.salt
     FROM users
     INNER JOIN google_accounts ON google_accounts.user_id = users.id
     WHERE google_accounts.google_sub = ?`,
    googleSub,
  );
}

export async function linkGoogleAccount(
  fastify: FastifyInstance,
  userId: number,
  googleSub: string,
  email?: string,
  emailVerified?: boolean,
) {
  await fastify.db.run(
    `INSERT INTO google_accounts (user_id, google_sub, email, email_verified)
     VALUES (?, ?, ?, ?)`,
    userId,
    googleSub,
    email ?? null,
    emailVerified ? 1 : 0,
  );
}

export async function findUserByPuid(
  fastify: FastifyInstance,
  puid: string,
) {
  return fastify.db.get<StoredUser>(
    "SELECT id, puid, name, password, salt FROM users WHERE puid = ?",
    puid,
  );
}

export async function verifyUserCredentials(
  fastify: FastifyInstance,
  name: string,
  password: string,
) {
  const user = await findUserByName(fastify, name);
  if (!user) {
    return null;
  }

  if (isArgonHash(user.password)) {
    try {
      const match = await argon2.verify(user.password, password);
      if (!match) {
        return null;
      }
    } catch {
      return null;
    }
  } else {
    const hashed = legacyHashPassword(password, user.salt);
    if (hashed !== user.password) {
      return null;
    }
  }

  return user;
}

function decodeBase32(value: string) {
  const normalized = value.toUpperCase();
  const trimmed = normalized.replace(/=+$/g, "");
  if (!trimmed || /[^A-Z2-7]/.test(trimmed)) {
    return null;
  }
  const cleaned = trimmed;
  let bits = "";
  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

const TOTP_WINDOW = 1;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_HASH_ALGORITHM = "sha1";
const TOTP_TRUNCATION_OFFSET_MASK = 0x0f;
const TOTP_TRUNCATION_VALUE_MASK = 0x7f;
const BYTE_MASK = 0xff;

export function verifyTotp(
  secret: string,
  token: string,
  window = TOTP_WINDOW,
  stepSeconds = TOTP_STEP_SECONDS,
  digits = TOTP_DIGITS,
) {
  const key = decodeBase32(secret);
  if (!key) return null;
  if (!key.length) return false;
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / stepSeconds);
  for (let offset = -window; offset <= window; offset += 1) {
    const ctr = counter + offset;
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(ctr));
    const hmac = createHmac(TOTP_HASH_ALGORITHM, key).update(buf).digest();
    const index = hmac[hmac.length - 1] & TOTP_TRUNCATION_OFFSET_MASK;
    const code =
      ((hmac[index] & TOTP_TRUNCATION_VALUE_MASK) << 24) |
      ((hmac[index + 1] & BYTE_MASK) << 16) |
      ((hmac[index + 2] & BYTE_MASK) << 8) |
      (hmac[index + 3] & BYTE_MASK);
    const otp = (code % 10 ** digits).toString().padStart(digits, "0");
    if (otp === token) return true;
  }
  return false;
}

type GoogleTokenInfoResponse = {
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

export type GoogleProfile = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
};

export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
): Promise<GoogleProfile | null> {
  try {
    const url = new URL("https://oauth2.googleapis.com/tokeninfo");
    url.searchParams.set("id_token", idToken);

    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }

    const payload = (await res.json()) as GoogleTokenInfoResponse;

    if (!payload.sub || payload.aud !== clientId) {
      return null;
    }

    const emailVerified =
      typeof payload.email_verified === "string"
        ? payload.email_verified === "true"
        : Boolean(payload.email_verified);

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified,
    };
  } catch (error) {
    return null;
  }
}
