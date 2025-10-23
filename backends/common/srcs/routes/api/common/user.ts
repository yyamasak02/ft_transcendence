// ユーザー登録・ログインAPI例
// Register: curl -X POST http://localhost:8080/api/common/user/register -H "Content-Type: application/json" -d '{"name":"foo","password":"barbazqux"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"name":"admin","password":"42admin"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"name":"foo","password":"barbazqux"}'
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { FastifyInstance } from "fastify";
import { randomBytes, createHash } from "node:crypto";

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

function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(password + salt).digest("hex");
}

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
      const { name, password } = request.body as LoginBody;
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
      const { name, password } = request.body as RegisterBody;
      const row = await fastify.db.get<{
        id: number;
        name: string;
        password: string;
        salt: string;
      }>("SELECT id, name, password, salt FROM users WHERE name = ?", name);

      if (!row) {
        reply.code(401);
        return { message: "Invalid credentials." };
      }

      const hashed = hashPassword(password, row.salt);
      if (hashed !== row.password) {
        reply.code(401);
        return { message: "Invalid credentials." };
      }

      return { id: row.id, name: row.name };
    },
  );

  f.get(
    "/user/information",
    {
      schema: {
        tags: ["User"],
        querystring: userInformationQuerySchema,
        response: {
          200: userInformationResponseSchema,
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
      schema: {
        tags: ["User"],
        body: userBanBodySchema,
        response: {
          200: userActionResponseSchema,
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
      schema: {
        tags: ["User"],
        body: userBlockBodySchema,
        response: {
          200: userActionResponseSchema,
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
        },
      },
    },
    async (request) => {
      const { userId, token } = request.body as DestroyTokenBody;

      return {
        message: `Token ${token} destroyed for user ${userId}.`,
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
        },
      },
    },
    async (request) => {
      const { refreshToken } = request.body as RefreshTokenBody;

      return {
        accessToken: `new-access-token-for-${refreshToken}`,
        refreshToken: `new-refresh-token-for-${refreshToken}`,
      };
    },
  );

  f.patch(
    "/user/password",
    {
      schema: {
        tags: ["User"],
        body: updatePasswordBodySchema,
        response: {
          200: userActionResponseSchema,
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
      schema: {
        tags: ["User"],
        body: deleteUserBodySchema,
        response: {
          200: userActionResponseSchema,
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
