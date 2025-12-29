import { WebSocket } from "@fastify/websocket";
import { EventTypes, ActionTypes } from "./consts.js";

export interface Stomp {
  event_type: (typeof EventTypes)[keyof typeof EventTypes];
  payload: any;
}

export type JoinQuery = {
  action: (typeof ActionTypes)[keyof typeof ActionTypes];
  joinRoomId?: string;
  userId: string;
};
