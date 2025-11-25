// ユーザー登録・ログインAPI例
// Register: curl -X POST http://localhost:8080/api/common/user/register -H "Content-Type: application/json" -d '{"name":"foo","password":"barbazqux"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"name":"admin","password":"42admin"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"name":"foo","password":"barbazqux"}'
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import type { AccessTokenPayload } from "../../../types/jwt.js";
import {
  issueTokens,
  hashPassword,
  verifyUserCredentials,
  issueLongTermToken,
  verifyLongTermToken,
  removeLongTermToken,
  findUserByPuid,
  findUserByName,
  generatePuid,
} from "../../../utils/auth.js";
import {
  deleteUserBodySchema,
  destroyTokenBodySchema,
  errorResponseSchema,
  loginBodySchema,
  loginSuccessSchema,
  refreshTokenBodySchema,
  refreshTokenResponseSchema,
  registerBodySchema,
  registerResponseSchema,
  updatePasswordBodySchema,
  userActionResponseSchema,
  userBanBodySchema,
  userBlockBodySchema,
  userInformationQuerySchema,
  userInformationResponseSchema,
  puidLookupQuerySchema,
  puidLookupResponseSchema,
} from "../../../schemas/user.js";
import type {
  DeleteUserBody,
  DestroyTokenBody,
  LoginBody,
  RefreshTokenBody,
  RegisterBody,
  UpdatePasswordBody,
  UserBanBody,
  UserBlockBody,
  UserIdentifier,
  PuidLookupQuery,
} from "../../../schemas/user.js";

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
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, password } = request.body as RegisterBody;
      const salt = randomBytes(16).toString("hex");
      const hashedPassword = hashPassword(password, salt);

      for (let attempt = 0; attempt < 5; attempt++) {
        const puid = generatePuid();
        try {
          await fastify.db.run(
            "INSERT INTO users (name, password, salt, puid) VALUES (?, ?, ?, ?)",
            name,
            hashedPassword,
            salt,
            puid,
          );

          reply.code(201);
          return { message: "User registered." };
        } catch (error) {
          if (
            error instanceof Error &&
            /UNIQUE constraint failed: users\.name/.test(error.message)
          ) {
            reply.code(409);
            return { message: "User already exists." };
          }

          if (
            error instanceof Error &&
            /UNIQUE constraint failed: (users\.puid|idx_users_puid)/.test(
              error.message,
            )
          ) {
            continue;
          }

          throw error;
        }
      }

      fastify.log.error(
        { username: name },
        "Failed to generate unique PUID after 5 attempts during user registration."
      );
      reply.code(500);
      return { message: "Failed to generate unique PUID." };
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
      const { name, password, longTerm } = request.body as LoginBody;
      const user = await verifyUserCredentials(fastify, name, password);
      if (!user) {
        reply.code(401);
        return { message: "Invalid credentials." };
      }

      const tokens = await issueTokens(fastify, {
        id: user.id,
        puid: user.puid,
        name: user.name,
      });

      let longTermToken: string | undefined;
      if (longTerm) {
        const issued = await issueLongTermToken(fastify, user.id);
        longTermToken = issued.token;
      }

      return {
        ...tokens,
        ...(longTermToken ? { longTermToken } : {}),
      };
    },
  );

  f.get(
    "/user/puid",
    {
      schema: {
        tags: ["User"],
        querystring: puidLookupQuerySchema,
        response: {
          200: puidLookupResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name } = request.query as PuidLookupQuery;
      const user = await findUserByName(fastify, name);
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      return { puid: user.puid };
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
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { puid } = request.query as UserIdentifier;
      const user = await findUserByPuid(fastify, puid);
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      return {
        id: user.id,
        name: user.name,
        puid: user.puid,
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
      const { puid, reason } = request.body as UserBanBody;

      return {
        message: `User ${puid} banned${reason ? ` for ${reason}` : ""}.`,
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
      const { puid, targetPuid } = request.body as UserBlockBody;

      return {
        message: `User ${puid} blocked user ${targetPuid}.`,
      };
    },
  );

  f.get(
    "/user/jwt_test",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const payload = request.user as AccessTokenPayload;

      return {
        message: `JWT verified for user ${payload.name} (puid: ${payload.puid}).`,
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
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { puid, longTermToken } = request.body as DestroyTokenBody;

      if (!longTermToken) {
        reply.code(400);
        return { message: "Token is required." };
      }

      const user = await findUserByPuid(fastify, puid);
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      const verified = await verifyLongTermToken(fastify, longTermToken);
      if (!verified || verified.userId !== user.id) {
        reply.code(400);
        return { message: "Invalid token." };
      }

      await removeLongTermToken(fastify, longTermToken);
      return {
        message: `Long-term token revoked for user ${puid}.`,
      };
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
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { longTermToken } = request.body as RefreshTokenBody;


      const verified = await verifyLongTermToken(fastify, longTermToken);
      if (!verified) {
        reply.code(401);
        return { message: "Invalid long-term token." };
      }

      const user = await fastify.db.get<{ id: number; name: string; puid: string }>(
        "SELECT id, name, puid FROM users WHERE id = ?",
        verified.userId,
      );

      if (!user) {
        await removeLongTermToken(fastify, longTermToken);
        reply.code(401);
        return { message: "User no longer exists." };
      }

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
      const { puid } = request.body as UpdatePasswordBody;

      return {
        message: `Password updated for user ${puid}.`,
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
      const { puid, reason } = request.body as DeleteUserBody;

      return {
        message: `User ${puid} deleted${reason ? ` for ${reason}` : ""}.`,
      };
    },
  );
}
