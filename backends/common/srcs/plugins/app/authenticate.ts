import fp from "fastify-plugin";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate(
      "authenticate",
      async function (request: FastifyRequest, reply: FastifyReply) {
        try {
          await request.jwtVerify();
        } catch (error) {
          reply.send(error);
        }
      },
    );
  },
  {
    name: "authenticate",
  },
);

declare module "fastify" {
  interface FastifyInstance {
    authenticate(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void>;
  }
}
