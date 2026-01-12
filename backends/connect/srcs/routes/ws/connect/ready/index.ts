import type { FastifyInstance } from "fastify";
import { makeReadyWsHandler } from "../../../../game/readyEngine.js";
import { readyQuerySchema } from "../../../../schemas/ws.js";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
    { websocket: true, schema: { querystring: readyQuerySchema } },
    makeReadyWsHandler(fastify),
  );
}
