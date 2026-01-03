import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { v4 as uuidv4 } from "uuid";

export default async function (fastify: FastifyInstance) {
  // Plugin simpleRooms is autoloaded from plugins/app

  const CreateRoomBody = Type.Object({ userId: Type.String() });
  fastify.post(
    "/",
    { schema: { body: CreateRoomBody } },
    async (req, reply) => {
      const { userId } = req.body as { userId: string };
      const roomId = uuidv4();
      const room = fastify.simpleRooms.create(roomId, userId);
      return reply.code(201).send({ roomId: room.roomId, status: room.status });
    },
  );

  const JoinRoomBody = Type.Object({ userId: Type.String() });
  fastify.post(
    "/:roomId/join",
    { schema: { body: JoinRoomBody } },
    async (req, reply) => {
      const { roomId } = req.params as { roomId: string };
      const { userId } = req.body as { userId: string };
      const joined = fastify.simpleRooms.join(roomId, userId);
      if (!joined) {
        return reply.code(404).send({ error: "room_not_found" });
      }
      return reply.send({ roomId: joined.roomId, status: joined.status });
    },
  );

  fastify.get("/:roomId/status", async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const room = fastify.simpleRooms.get(roomId);
    if (!room) return reply.code(404).send({ error: "room_not_found" });
    return reply.send({
      roomId: room.roomId,
      hostUserId: room.hostUserId,
      guestUserId: room.guestUserId,
      status: room.status,
    });
  });
}
