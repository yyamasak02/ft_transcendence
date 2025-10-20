import type { FastifyPluginAsync } from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { User, UserType } from "../../../schemas/auth.js";

const plugin: FastifyPluginAsync = async (fastify) => {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

  f.get<{ Reply: UserType }>(
    "/users",
    {
      schema: {
        tags: ["Auth"],
        response: {
          200: Type.Ref("User"),
        },
      },
    },
    async (_, rep) => {
      const name = "inoh";
      const id = 1;
      const password = "securepassword";
      const salt = "randomsalt";
      rep.status(200).send({ id, name, password, salt });
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
