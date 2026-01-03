import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

export type SimpleRoomStatus = "waiting" | "matched";

export interface SimpleRoom {
  roomId: string;
  hostUserId: string;
  guestUserId?: string;
  status: SimpleRoomStatus;
}

class SimpleRoomManager {
  private rooms = new Map<string, SimpleRoom>();

  create(roomId: string, hostUserId: string): SimpleRoom {
    const room: SimpleRoom = { roomId, hostUserId, status: "waiting" };
    this.rooms.set(roomId, room);
    return room;
  }

  join(roomId: string, guestUserId: string): SimpleRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.status === "matched") return room;
    room.guestUserId = guestUserId;
    room.status = "matched";
    this.rooms.set(roomId, room);
    return room;
  }

  get(roomId: string): SimpleRoom | null {
    return this.rooms.get(roomId) ?? null;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    simpleRooms: SimpleRoomManager;
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate("simpleRooms", new SimpleRoomManager());
  },
  { name: "simpleRooms" },
);
