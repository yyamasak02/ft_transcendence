import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Database } from "sqlite";
import { WebSocket } from "@fastify/websocket";
import { RoomManager } from "../plugins/app/room.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    roomManager: RoomManager;
  }

  interface FastifyRequest {}
}

export {};
