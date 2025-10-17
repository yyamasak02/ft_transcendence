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
}
