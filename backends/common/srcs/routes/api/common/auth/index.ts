import type { FastifyPluginAsync } from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { UsersSchema } from "../../../../schemas/auth.js";
import {
  issueTokens,
  verifyUserCredentials,
} from "../../../../utils/auth.js";
import type { AccessTokenPayload } from "../../../../types/jwt.js";

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

const meResponseSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
});

const errorResponseSchema = Type.Object({
  message: Type.String(),
});

type LoginBody = {
  name: string;
  password: string;
};

const plugin: FastifyPluginAsync = async (fastify) => {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

  f.get(
    "/users",
    {
      schema: {
        tags: ["Auth"],
        response: {
          200: UsersSchema,
        },
      },
    },
    async () => {
      return fastify.db.all("SELECT * FROM users");
    },
  );

  f.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
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

      const tokens = await issueTokens(fastify, user);
      return { id: user.id, name: user.name, ...tokens };
    },
  );

  f.post(
    "/me",
    {
      schema: {
        tags: ["Auth"],
        response: {
          200: meResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async function (req, reply) {
      try {
        const payload = await req.jwtVerify<AccessTokenPayload>();
        if (payload.type !== "access") {
          reply.code(401);
          return { message: "Access token is required." };
        }
        return { id: payload.userId, name: payload.name };
      } catch (error) {
        reply.send(error);
      }
    },
  );
};

export default plugin;
