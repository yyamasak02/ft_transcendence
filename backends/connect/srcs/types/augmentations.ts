import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Database } from "sqlite";
import { WebSocket } from "@fastify/websocket";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    rooms: Map<String, any>;
    socketToRoom: Map<WebSocket, String>;
  }

  interface FastifyRequest {}
}

export {};
