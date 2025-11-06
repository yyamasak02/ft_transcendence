import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "./jwt.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
    user: AccessTokenPayload;
  }
}
