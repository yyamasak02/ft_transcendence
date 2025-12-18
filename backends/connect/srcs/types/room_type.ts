import { RoomStatus } from "./consts.js";
import { WebSocket } from "@fastify/websocket";

export interface UserInfo {
  userId: string;
  socket: WebSocket;
  isHost: boolean;
  joinRoomId: string;
}

export interface RoomInfo {
  status: (typeof RoomStatus)[keyof typeof RoomStatus];
  hostUserId: string;
  users: Map<string, UserInfo>;
}
