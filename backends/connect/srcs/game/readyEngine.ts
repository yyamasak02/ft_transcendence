import type { FastifyInstance } from "fastify";
import { GameService } from "./service/message_service.js";
import { makeMessageHandler } from "./handler/message_handler.js";

export function makeReadyWsHandler(fastify: FastifyInstance) {
  const service = new GameService(fastify);
  return makeMessageHandler(service);
}
