import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

export default fp(async function (fastify) {
  await fastify.register(jwt, {
    secret: "supersecret",
  });
});
