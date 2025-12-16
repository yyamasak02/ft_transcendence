import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { WebSocket } from "@fastify/websocket";

export default fp(
  async (fastify: FastifyInstance) => {
    const rooms = new Map<String, any>();
    const socketToRoom = new Map<WebSocket, String>();
    fastify.decorate("rooms", rooms);
    fastify.decorate("socketToRoom", socketToRoom);
  },
  {
    name: "room",
  },
);
