import type { FastifyPluginAsync } from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { UsersSchema } from "../../../../schemas/auth.js";

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
        response: {
          200: Type.String(),
        },
      },
    },
    async () => {
      return f.jwt.sign({ name: "inoh" });
    },
  );

  f.post(
    "/me",
    {
      schema: {
        tags: ["Auth"],
        response: {
          200: Type.String(),
        },
      },
    },
    async function (req, _) {
      const payload = await req.jwtVerify<{ name: string }>();
      return payload.name;
    },
  );
};

export default plugin;
