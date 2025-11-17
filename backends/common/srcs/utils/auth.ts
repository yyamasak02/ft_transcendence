import { createHash, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../types/jwt.js";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";
export const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type StoredUser = {
  id: number;
  name: string;
  password: string;
  salt: string;
};

export function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(password + salt).digest("hex");
}

async function persistRefreshToken(
  fastify: FastifyInstance,
  {
    tokenId,
    userId,
    expiresAt,
  }: { tokenId: string; userId: number; expiresAt: Date },
) {
  await fastify.db.run(
    "INSERT INTO refresh_tokens (token_id, user_id, expires_at) VALUES (?, ?, ?)",
    tokenId,
    userId,
    expiresAt.toISOString(),
  );
}

export async function removeRefreshToken(
  fastify: FastifyInstance,
  tokenId: string,
) {
  await fastify.db.run("DELETE FROM refresh_tokens WHERE token_id = ?", tokenId);
}

export async function issueTokens(
  fastify: FastifyInstance,
  user: { id: number; name: string },
) {
  const tokenId = randomUUID();
  const accessToken = fastify.jwt.sign(
    {
      userId: user.id,
      name: user.name,
      type: "access",
    } satisfies AccessTokenPayload,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );
  const refreshToken = fastify.jwt.sign(
    {
      userId: user.id,
      name: user.name,
      type: "refresh",
      tokenId,
    } satisfies RefreshTokenPayload,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
  );

  await persistRefreshToken(fastify, {
    tokenId,
    userId: user.id,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
}

export async function findUserByName(
  fastify: FastifyInstance,
  name: string,
) {
  return fastify.db.get<StoredUser>(
    "SELECT id, name, password, salt FROM users WHERE name = ?",
    name,
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

  const hashed = hashPassword(password, user.salt);
  if (hashed !== user.password) {
    return null;
  }

  return user;
}
