import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AccessTokenPayload } from "../../types/jwt.js";

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate(
      "authenticate",
      async function (request: FastifyRequest, reply: FastifyReply) {
        try {
          const payload = await request.jwtVerify<AccessTokenPayload>();
          if (payload.type !== "access") {
            reply.code(401);
            return reply.send({ message: "Access token is required." });
          }
          try {
            await fastify.db.run(
              "UPDATE users SET last_accessed_at = datetime('now') WHERE id = ?",
              payload.userId,
            );
          } catch (error) {
            fastify.log.error(
              { err: error },
              "Failed to update last access time.",
            );
          }
        } catch (error) {
          return reply.send(error);
        }
      },
    );
  },
  {
    name: "authenticate",
  },
);
