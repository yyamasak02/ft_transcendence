import { RoomStatus } from "./consts.js";
import { WebSocket } from "@fastify/websocket";
import { GameState } from "../game/GameState.js";

export interface UserInfo {
  userId: string;
  socket: WebSocket;
  isHost: boolean;
  joinRoomId: string;
}

export interface RoomInfo {
  roomId: string;
  status: (typeof RoomStatus)[keyof typeof RoomStatus];
  hostUserId: string;
  users: Map<string, UserInfo>;
  game?: GameState;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export interface Paddle {
  userId: string;
  y: number;
  height: number;
  speed: number;
}
