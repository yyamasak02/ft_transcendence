import { Static, Type } from "@sinclair/typebox";

const T_WAITING = Type.Literal("waiting");
const T_MATCHED = Type.Literal("matched");

export const ROOM_STATUS = {
  WAITING: T_WAITING.const,
  MATCHED: T_MATCHED.const,
} as const;

const RoomStatusType = Type.Union([T_WAITING, T_MATCHED]);

// Common error response (aligned with backends/common style)
export const errorResponseSchema = Type.Object({
  message: Type.String(),
});
export type ErrorResponse = Static<typeof errorResponseSchema>;

// POST /api/connect/rooms
export const createRoomBodySchema = Type.Object({
  userId: Type.String({ minLength: 1 }),
});
export type CreateRoomBody = Static<typeof createRoomBodySchema>;

export const createRoomResponseSchema = Type.Object({
  roomId: Type.String({ minLength: 1 }),
  status: RoomStatusType,
});
export type CreateRoomResponse = Static<typeof createRoomResponseSchema>;

// POST /api/connect/rooms/:roomId/join
export const joinRoomBodySchema = Type.Object({
  userId: Type.String({ minLength: 1 }),
});
export type JoinRoomBody = Static<typeof joinRoomBodySchema>;

export const joinRoomResponseSchema = Type.Object({
  roomId: Type.String({ minLength: 1 }),
  status: RoomStatusType,
});
export type JoinRoomResponse = Static<typeof joinRoomResponseSchema>;

// GET /api/connect/rooms/:roomId/status
export const roomStatusResponseSchema = Type.Object({
  roomId: Type.String({ minLength: 1 }),
  hostUserId: Type.String({ minLength: 1 }),
  guestUserId: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  status: RoomStatusType,
});
export type RoomStatusResponse = Static<typeof roomStatusResponseSchema>;
