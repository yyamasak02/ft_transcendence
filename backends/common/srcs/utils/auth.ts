import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { AccessTokenPayload } from "../types/jwt.js";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const LONG_TERM_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

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
