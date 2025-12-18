import { WebSocket } from "@fastify/websocket";

export const RoomStatus = {
  WAITING: "00",
  OCCUPIED: "01",
} as const;

export const ActionTypes = {
  CREATE: "00",
  JOIN: "01",
  HEART_BEAT: "02",
} as const;

export const EventTypes = {
  CREATED_ROOM: "00",
  JOINED_ROOM: "01",
  HEALTH_CHECK: "02",
} as const;
