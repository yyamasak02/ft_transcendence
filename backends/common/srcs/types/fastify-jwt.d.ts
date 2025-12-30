import type { AccessTokenPayload, AuthTokenPayload } from "./jwt.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AccessTokenPayload;
  }
}
