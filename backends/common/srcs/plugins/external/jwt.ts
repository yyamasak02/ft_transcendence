import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

export default fp(async function (fastify) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  await fastify.register(jwt, {
    secret,
  });
});
