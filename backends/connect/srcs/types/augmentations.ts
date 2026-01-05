import type { Database } from "sqlite";
import { SimpleRoomManager } from "../plugins/app/simpleRooms.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    simpleRooms: SimpleRoomManager;
  }

  interface FastifyRequest {}
}

export {};
