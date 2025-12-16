import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { v4 as uuidv4 } from "uuid";
import room from "../../../plugins/app/room.js";
import { WebSocket } from "@fastify/websocket";

const RoomStatus = {
  WAITING: "00",
  CONNECTED: "01",
} as const;

const ActionTypes = {
  CREATE: "00",
  JOIN: "01",
  HEART_BEAT: "02",
} as const;

const EventTypes = {
  CREATED_ROOM: "00",
  JOINED_ROOM: "01",
  HEALTH_CHECK: "02",
} as const;

interface Connect {
  hostId: string;
  hostSocket: WebSocket | null;
  opponentId: string | null;
  opponentSocket: WebSocket | null;
  status: (typeof RoomStatus)[keyof typeof RoomStatus];
}

interface Stomp {
  event_type: (typeof EventTypes)[keyof typeof EventTypes];
  payload: any;
}

type JoinQuery = {
  action: (typeof ActionTypes)[keyof typeof ActionTypes];
  joinRoomId?: string;
};

const querySchema = Type.Object({
  action: Type.String(),
  joinRoomId: Type.Optional(Type.String()),
});

export default async function (fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();
  f.get(
    "/connect",
    {
      websocket: true,
      schema: { querystring: querySchema },
    },
    async (socket, req) => {
      // 待機中、マッチ中の管理
      // マッチ中のリクエスト管理
      // health check
      const { action, joinRoomId } = req.query as JoinQuery;
      console.log(
        "request: ",
        action,
        joinRoomId,
        ActionTypes.CREATE === action,
      );

      if (ActionTypes.CREATE === action) {
        const newUuid = uuidv4();
        const newRoom: Connect = {
          hostId: "a",
          hostSocket: socket,
          opponentId: null,
          opponentSocket: null,
          status: RoomStatus.WAITING,
        };
        fastify.rooms.set(newUuid, newRoom);
        fastify.socketToRoom.set(socket, newUuid);
        const response: Stomp = {
          event_type: EventTypes.CREATED_ROOM,
          payload: { newUuid: newUuid },
        };
        socket.send(JSON.stringify(response));
      } else if (ActionTypes.JOIN === action && joinRoomId) {
        const room = fastify.rooms.get(joinRoomId);
        if (
          !room ||
          room.status !== RoomStatus.WAITING ||
          room.opponentId !== null
        ) {
          socket.close(1000, "Join failed");
          return;
        }
        // 値設定
        room.opponentId = "b";
        room.opponentSocket = socket;
        room.status = RoomStatus.CONNECTED;

        // 接続したというレスポンスを返す
        fastify.socketToRoom.set(socket, joinRoomId);
        const hostResponse: Stomp = {
          event_type: EventTypes.JOINED_ROOM,
          payload: { opponentId: room.opponentId, hostFlag: true },
        };
        const opponentResponse: Stomp = {
          event_type: EventTypes.JOINED_ROOM,
          payload: { opponentId: room.opponentId, hostFlag: false },
        };
        room.hostSocket.send(JSON.stringify(hostResponse));
        room.opponentSocket.send(JSON.stringify(opponentResponse));
      }
      socket.on("message", (message) => {
        const data = JSON.parse(message.toString());
        if (ActionTypes.HEART_BEAT === data.action_type) {
          const heartResponse: Stomp = {
            event_type: EventTypes.HEALTH_CHECK,
            payload: { status: "alive" },
          };
          socket.send(JSON.stringify(heartResponse));
          return;
        }
      });
      // 切断動作は適当にしている
      socket.on("close", () => {
        const uuid = fastify.socketToRoom.get(socket);
        if (uuid) {
          const tmp = fastify.rooms.get(uuid);
          if (tmp) {
            fastify.socketToRoom.delete(tmp.hostSocket);
            fastify.socketToRoom.delete(tmp.opponentSocket);
          }
          fastify.rooms.delete(uuid);
        }
      });
    },
  );
}
