// ユーザー登録・ログインAPI例
// Register: curl -X POST http://localhost:8080/api/common/user/register -H "Content-Type: application/json" -d '{"name":"foo","password":"barbazqux"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"name":"admin","password":"42admin"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"name":"foo","password":"barbazqux"}'
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import type { RefreshTokenPayload } from "../../../types/jwt.js";
import {
  issueTokens,
  hashPassword,
  removeRefreshToken,
  verifyUserCredentials,
} from "../../../utils/auth.js";

const registerBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 8 }),
});

const registerResponseSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
});

type RegisterBody = {
  name: string;
  password: string;
};

type LoginBody = {
  name: string;
  password: string;
};

const errorResponseSchema = Type.Object({
  message: Type.String(),
});

const loginBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
});

const loginSuccessSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  accessToken: Type.String(),
  refreshToken: Type.String(),
});

const userIdentifierSchema = Type.Object({
  userId: Type.Number({ minimum: 1 }),
});

const userActionResponseSchema = Type.Object({
  message: Type.String(),
});

const userInformationQuerySchema = userIdentifierSchema;

const userInformationResponseSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  status: Type.String(),
});

const userBanBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    reason: Type.Optional(Type.String()),
  }),
]);

const userBlockBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    targetUserId: Type.Number({ minimum: 1 }),
  }),
]);

const destroyTokenBodySchema = Type.Object({
  userId: Type.Number({ minimum: 1 }),
  token: Type.String({ minLength: 1 }),
});

const refreshTokenBodySchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 }),
});

const refreshTokenResponseSchema = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
});

const updatePasswordBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    currentPassword: Type.String({ minLength: 1 }),
    newPassword: Type.String({ minLength: 8 }),
  }),
]);

const deleteUserBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    reason: Type.Optional(Type.String()),
  }),
]);

type UserIdentifier = {
  userId: number;
};

type UserBanBody = UserIdentifier & {
  reason?: string;
};

type UserBlockBody = UserIdentifier & {
  targetUserId: number;
};

type DestroyTokenBody = {
  userId: number;
  token: string;
};

type RefreshTokenBody = {
  refreshToken: string;
};

type UpdatePasswordBody = UserIdentifier & {
  currentPassword: string;
  newPassword: string;
};

type DeleteUserBody = UserIdentifier & {
  reason?: string;
};

export default async function (fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

  f.post(
    "/user/register",
    {
      schema: {
        tags: ["User"],
        body: registerBodySchema,
        response: {
          201: registerResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, password } = request.body as RegisterBody;
      const salt = randomBytes(16).toString("hex");
      const hashedPassword = hashPassword(password, salt);

      try {
        const result = await fastify.db.run(
          "INSERT INTO users (name, password, salt) VALUES (?, ?, ?)",
          name,
          hashedPassword,
          salt,
        );

        reply.code(201);
        return { id: result.lastID ?? 0, name };
      } catch (error) {
        if (
          error instanceof Error &&
          /UNIQUE constraint failed: users\.name/.test(error.message)
        ) {
          reply.code(409);
          return { message: "User already exists." };
        }

        throw error;
      }
    },
  );

  f.post(
    "/user/login",
    {
      schema: {
        tags: ["User"],
        body: loginBodySchema,
        response: {
          200: loginSuccessSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, password } = request.body as LoginBody;
      const user = await verifyUserCredentials(fastify, name, password);
      if (!user) {
        reply.code(401);
        return { message: "Invalid credentials." };
      }

      const tokens = await issueTokens(fastify, {
        id: user.id,
        name: user.name,
      });

      return { id: user.id, name: user.name, ...tokens };
    },
  );

  f.get(
    "/user/information",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        querystring: userInformationQuerySchema,
        response: {
          200: userInformationResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { userId } = request.query as UserIdentifier;

      return {
        id: userId,
        name: "placeholder",
        status: "active",
      };
    },
  );

  f.post(
    "/user/ban",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: userBanBodySchema,
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { userId, reason } = request.body as UserBanBody;

      return {
        message: `User ${userId} banned${reason ? ` for ${reason}` : ""}.`,
      };
    },
  );

  f.post(
    "/user/block",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: userBlockBodySchema,
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { userId, targetUserId } = request.body as UserBlockBody;

      return {
        message: `User ${userId} blocked user ${targetUserId}.`,
      };
    },
  );

  f.post(
    "/user/destroy_token",
    {
      schema: {
        tags: ["User"],
        body: destroyTokenBodySchema,
        response: {
          200: userActionResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { userId, token } = request.body as DestroyTokenBody;

      try {
        const payload = fastify.jwt.verify<RefreshTokenPayload>(token);
        if (payload.type !== "refresh" || payload.userId !== userId) {
          throw new Error("Token/user mismatch");
        }

        await removeRefreshToken(fastify, payload.tokenId);
        return {
          message: `Token revoked for user ${userId}.`,
        };
      } catch {
        reply.code(400);
        return { message: "Invalid token." };
      }
    },
  );

  f.post(
    "/user/refresh_token",
    {
      schema: {
        tags: ["User"],
        body: refreshTokenBodySchema,
        response: {
          200: refreshTokenResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { refreshToken } = request.body as RefreshTokenBody;

      let payload: RefreshTokenPayload;
      try {
        payload = fastify.jwt.verify<RefreshTokenPayload>(refreshToken);
      } catch {
        reply.code(401);
        return { message: "Invalid refresh token." };
      }

      if (payload.type !== "refresh") {
        reply.code(401);
        return { message: "Invalid refresh token." };
      }

      const storedToken = await fastify.db.get<{
        token_id: string;
        expires_at: string;
      }>(
        "SELECT token_id, expires_at FROM refresh_tokens WHERE token_id = ?",
        payload.tokenId,
      );

      if (!storedToken) {
        reply.code(401);
        return { message: "Refresh token has been revoked." };
      }

      if (Date.parse(storedToken.expires_at) <= Date.now()) {
        await removeRefreshToken(fastify, payload.tokenId);
        reply.code(401);
        return { message: "Refresh token expired." };
      }

      const user = await fastify.db.get<{ id: number; name: string }>(
        "SELECT id, name FROM users WHERE id = ?",
        payload.userId,
      );

      if (!user) {
        await removeRefreshToken(fastify, payload.tokenId);
        reply.code(401);
        return { message: "User no longer exists." };
      }

      await removeRefreshToken(fastify, payload.tokenId);
      return issueTokens(fastify, user);
    },
  );

  f.patch(
    "/user/password",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: updatePasswordBodySchema,
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { userId } = request.body as UpdatePasswordBody;

      return {
        message: `Password updated for user ${userId}.`,
      };
    },
  );

  f.delete(
    "/user/delete",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: deleteUserBodySchema,
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { userId, reason } = request.body as DeleteUserBody;

      return {
        message: `User ${userId} deleted${reason ? ` for ${reason}` : ""}.`,
      };
    },
  );
}
