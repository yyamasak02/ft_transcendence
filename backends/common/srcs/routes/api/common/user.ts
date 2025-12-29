// ユーザー登録・ログインAPI例
// Register: curl -X POST http://localhost:8080/api/common/user/register -H "Content-Type: application/json" -d '{"name":"foo","password":"barbazqux"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"name":"admin","password":"42admin"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"name":"foo","password":"barbazqux"}'
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import {
  issueTokens,
  hashPassword,
  verifyUserCredentials,
  issueLongTermToken,
  issueTwoFactorToken,
  verifyLongTermToken,
  removeLongTermToken,
  findUserByPuid,
  findUserByName,
  findUserByGoogleSub,
  linkGoogleAccount,
  generatePuid,
  verifyTotp,
  generateTotpSecret,
  verifyGoogleIdToken,
} from "../../../utils/auth.js";
import {
  deleteUserBodySchema,
  destroyTokenBodySchema,
  errorResponseSchema,
  loginBodySchema,
  loginResponseSchema,
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
  googleLoginBodySchema,
  googleRegisterBodySchema,
  twoFactorEnableResponseSchema,
  twoFactorVerifyBodySchema,
  twoFactorStatusResponseSchema,
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
  GoogleLoginBody,
  GoogleRegisterBody,
  TwoFactorVerifyBody,
} from "../../../schemas/user.js";

export default async function (fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

  f.post<{ Body: RegisterBody }>(
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
      const { name, password } = request.body;
      const salt = randomBytes(16).toString("hex");
      const hashedPassword = await hashPassword(password, salt);

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

  f.post<{ Body: LoginBody }>(
    "/user/login",
    {
      schema: {
        tags: ["User"],
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, password, longTerm } = request.body;
      const user = await verifyUserCredentials(fastify, name, password);
      if (!user) {
        reply.code(401);
        return { message: "Invalid credentials." };
      }

      const twoFactor = await fastify.db.get<{
        two_factor_enabled: number;
        two_factor_secret: string | null;
      }>(
        "SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
        user.id,
      );

      if (twoFactor?.two_factor_enabled && twoFactor.two_factor_secret) {
        const twoFactorToken = await issueTwoFactorToken(fastify, user.id);
        return { twoFactorRequired: true, twoFactorToken };
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

  f.post<{ Body: GoogleLoginBody }>(
    "/user/google_login",
    {
      schema: {
        tags: ["User"],
        body: googleLoginBodySchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        reply.code(500);
        return { message: "GOOGLE_CLIENT_ID is not configured." };
      }

      const googleProfile = await verifyGoogleIdToken(
        request.body.idToken,
        clientId,
      );

      if (!googleProfile) {
        reply.code(401);
        return { message: "Invalid Google ID token." };
      }

      const user = await findUserByGoogleSub(fastify, googleProfile.sub);
      if (!user) {
        reply.code(404);
        return { message: "Google account not registered." };
      }

      const twoFactor = await fastify.db.get<{
        two_factor_enabled: number;
        two_factor_secret: string | null;
      }>(
        "SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
        user.id,
      );

      if (twoFactor?.two_factor_enabled && twoFactor.two_factor_secret) {
        const twoFactorToken = await issueTwoFactorToken(fastify, user.id);
        return { twoFactorRequired: true, twoFactorToken };
      }

      const tokens = await issueTokens(fastify, {
        id: user.id,
        puid: user.puid,
        name: user.name,
      });

      let longTermToken: string | undefined;
      if (request.body.longTerm) {
        const issued = await issueLongTermToken(fastify, user.id);
        longTermToken = issued.token;
      }

      return {
        ...tokens,
        ...(longTermToken ? { longTermToken } : {}),
      };
    },
  );

  f.post<{ Body: GoogleRegisterBody }>(
    "/user/google_register",
    {
      schema: {
        tags: ["User"],
        body: googleRegisterBodySchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        reply.code(500);
        return { message: "GOOGLE_CLIENT_ID is not configured." };
      }

      const googleProfile = await verifyGoogleIdToken(
        request.body.idToken,
        clientId,
      );

      if (!googleProfile) {
        reply.code(401);
        return { message: "Invalid Google ID token." };
      }

      const existing = await findUserByGoogleSub(fastify, googleProfile.sub);
      if (existing) {
        reply.code(409);
        return { message: "Google account already registered." };
      }

      const { name } = request.body;
      const placeholderPassword = "";
      const placeholderSalt = "";

      let userId: number | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const puid = generatePuid();
        try {
          const result = await fastify.db.run(
            "INSERT INTO users (name, password, salt, puid) VALUES (?, ?, ?, ?)",
            name,
            placeholderPassword,
            placeholderSalt,
            puid,
          );
          userId = result.lastID ?? null;
          break;
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

      if (!userId) {
        reply.code(500);
        return { message: "Failed to provision user." };
      }

      await linkGoogleAccount(
        fastify,
        userId,
        googleProfile.sub,
        googleProfile.email,
        googleProfile.emailVerified,
      );

      const user = await fastify.db.get<{ id: number; puid: string; name: string }>(
        "SELECT id, puid, name FROM users WHERE id = ?",
        userId,
      );

      if (!user) {
        reply.code(500);
        return { message: "Failed to provision user." };
      }

      const tokens = await issueTokens(fastify, user);

      let longTermToken: string | undefined;
      if (request.body.longTerm) {
        const issued = await issueLongTermToken(fastify, user.id);
        longTermToken = issued.token;
      }

      return {
        ...tokens,
        ...(longTermToken ? { longTermToken } : {}),
      };
    },
  );

  f.get<{ Querystring: PuidLookupQuery }>(
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
      const { name } = request.query;
      const user = await findUserByName(fastify, name);
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      return { puid: user.puid };
    },
  );

  f.get<{ Querystring: UserIdentifier }>(
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
      const { puid } = request.query;
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

  f.post<{ Body: UserBanBody }>(
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
      const { puid, reason } = request.body;

      return {
        message: `User ${puid} banned${reason ? ` for ${reason}` : ""}.`,
      };
    },
  );

  f.post<{ Body: UserBlockBody }>(
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
      const { puid, targetPuid } = request.body;

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
      const payload = request.user;

      return {
        message: `JWT verified for user ${payload.name} (puid: ${payload.puid}).`,
      };
    },
  );

  f.post<{ Body: DestroyTokenBody }>(
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
      const { puid, longTermToken } = request.body;

      // リクエストにロングタームトークンが含まれているか検証し、欠けていれば即時400を返す
      if (!longTermToken) {
        reply.code(400);
        return { message: "Token is required." };
      }

      // puidでユーザーを取得できなければ、その場で404を返して処理を打ち切る
      const user = await findUserByPuid(fastify, puid);
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      // トークンの整合性と所有者を確認し、想定ユーザーのものではなければ400を返す
      const verified = await verifyLongTermToken(fastify, longTermToken);
      if (!verified || verified.userId !== user.id) {
        reply.code(400);
        return { message: "Invalid token." };
      }

      // 条件を満たした場合のみトークンを削除し、破棄完了メッセージを返す
      await removeLongTermToken(fastify, longTermToken);
      return {
        message: `Long-term token revoked for user ${puid}.`,
      };
    },
  );

  f.post<{ Body: RefreshTokenBody }>(
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
      const { longTermToken } = request.body;


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

  f.patch<{ Body: UpdatePasswordBody }>(
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
      const { puid } = request.body;

      return {
        message: `Password updated for user ${puid}.`,
      };
    },
  );

  f.delete<{ Body: DeleteUserBody }>(
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
      const { puid, reason } = request.body;

      return {
        message: `User ${puid} deleted${reason ? ` for ${reason}` : ""}.`,
      };
    },
  );

  f.post(
    "/user/enable_2fa",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        response: {
          200: twoFactorEnableResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const secret = generateTotpSecret();
      await fastify.db.run(
        "UPDATE users SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?",
        secret,
        request.user.userId,
      );
      return { token: secret };
    },
  );

  f.get(
    "/user/2fa_status",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        response: {
          200: twoFactorStatusResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const row = await fastify.db.get<{
        two_factor_enabled: number;
        two_factor_secret: string | null;
      }>(
        "SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
        request.user.userId,
      );
      const enabled = Boolean(row?.two_factor_enabled && row?.two_factor_secret);
      return { enabled };
    },
  );

  f.post<{ Body: TwoFactorVerifyBody }>(
    "/user/verify_2fa",
    {
      schema: {
        tags: ["User"],
        body: twoFactorVerifyBodySchema,
        response: {
          200: loginResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { twoFactorToken, code, longTerm } = request.body;
      let payload: { userId: number; type?: string };
      try {
        payload = await fastify.jwt.verify(twoFactorToken);
      } catch (error) {
        reply.code(401);
        return { message: "Invalid 2FA token." };
      }

      if (payload.type !== "2fa") {
        reply.code(401);
        return { message: "Invalid 2FA token." };
      }

      const user = await fastify.db.get<{
        id: number;
        puid: string;
        name: string;
        two_factor_enabled: number;
        two_factor_secret: string | null;
      }>(
        "SELECT id, puid, name, two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
        payload.userId,
      );

      if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
        reply.code(400);
        return { message: "2FA is not enabled." };
      }

      if (!verifyTotp(user.two_factor_secret, code)) {
        reply.code(401);
        return { message: "Invalid 2FA code." };
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
}
