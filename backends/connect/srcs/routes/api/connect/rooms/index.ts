import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import {
  createRoomBodySchema,
  createRoomResponseSchema,
  errorResponseSchema,
  joinRoomBodySchema,
  joinRoomResponseSchema,
  roomStatusResponseSchema,
  type CreateRoomBody,
  type JoinRoomBody,
} from "../../../../schemas/rooms.js";

export default async function (fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // Create room
  f.post<{ Body: CreateRoomBody }>(
    "/",
    {
      schema: {
        tags: ["Rooms"],
        body: createRoomBodySchema,
        response: {
          201: createRoomResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (req, reply) => {
      const { userId } = req.body;
      const roomId = uuidv4();
      const room = fastify.simpleRooms.create(roomId, userId);
      return reply.code(201).send({ roomId: room.roomId, status: room.status });
    },
  );

  // Join room
  f.post<{ Body: JoinRoomBody }>(
    "/:roomId/join",
    {
      schema: {
        tags: ["Rooms"],
        body: joinRoomBodySchema,
        response: {
          200: joinRoomResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (req, reply) => {
      const { roomId } = req.params as { roomId: string };
      const { userId } = req.body;
      const joined = fastify.simpleRooms.join(roomId, userId);
      if (!joined) {
        reply.code(404);
        return { message: "room_not_found" };
      }
      return reply.send({ roomId: joined.roomId, status: joined.status });
    },
  );

  // Get room status
  f.get(
    "/:roomId/status",
    {
      schema: {
        tags: ["Rooms"],
        response: {
          200: roomStatusResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (req, reply) => {
      const { roomId } = req.params as { roomId: string };
      const room = fastify.simpleRooms.get(roomId);
      if (!room) {
        reply.code(404);
        return { message: "room_not_found" };
      }
      return reply.send({
        roomId: room.roomId,
        hostUserId: room.hostUserId,
        guestUserId: room.guestUserId ?? null,
        status: room.status,
      });
    },
  );
}
