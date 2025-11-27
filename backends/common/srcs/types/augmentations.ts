import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { Database } from "sqlite";
import type { AccessTokenPayload } from "./jwt.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    authenticate(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void>;
  }

  interface FastifyRequest {
    user: AccessTokenPayload;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

export {};
