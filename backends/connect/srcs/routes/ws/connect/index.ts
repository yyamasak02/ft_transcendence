import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { ActionTypes, RoomStatus, EventTypes } from "../../../types/consts.js";
import { JoinQuery, Stomp } from "../../../types/api_type.js";
import { UserInfo } from "../../../types/room_type.js";
import room from "../../../plugins/app/room.js";

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
      const { action, joinRoomId, userId } = req.query as JoinQuery;
      if (ActionTypes.CREATE === action) {
        const newRoomId = fastify.roomManager.addRoom(userId, socket);
        const response: Stomp = {
          event_type: EventTypes.CREATED_ROOM,
          payload: { newRoomId: newRoomId },
        };
        socket.send(JSON.stringify(response));
      } else if (ActionTypes.JOIN === action && joinRoomId) {
        const roomInfo = fastify.roomManager.findRoomInfoByRoomId(joinRoomId);
        if (!roomInfo || RoomStatus.WAITING !== roomInfo?.status) {
          socket.close(1000, "Join failed");
          return;
        }
        // 値設定
        fastify.roomManager.addUser(joinRoomId, userId, socket);
        fastify.roomManager.setRoomStatus(joinRoomId, RoomStatus.OCCUPIED);

        const responseRoomInfo = {
          roomId: roomInfo.roomId,
          status: roomInfo.status,
          hostUserId: roomInfo.hostUserId,
          users: Array.from(roomInfo.users.values()).map((user) => ({
            userId: user.userId,
            isHost: user.isHost,
          })),
        };
        const response: Stomp = {
          event_type: EventTypes.JOINED_ROOM,
          payload: { responseRoomInfo },
        };
        fastify.roomManager.notifyAll(joinRoomId, JSON.stringify(response));
        fastify.roomManager.startGame(joinRoomId);
      }
      socket.on("message", (message) => {
        const data = JSON.parse(message.toString());
        console.log(socket);
        if (ActionTypes.HEART_BEAT === data.action_type) {
          const heartResponse: Stomp = {
            event_type: EventTypes.HEALTH_CHECK,
            payload: { status: "alive" },
          };
          socket.send(JSON.stringify(heartResponse));
          return;
        }
        if (ActionTypes.KEY_SIGNAL === data.action_type) {
          // console.log(data);
          const updateResult = fastify.roomManager.updateGame(
            data.roomId,
            data.userId,
            data.key,
          );
          if (!updateResult) {
            return;
          }
          const updateResponse: Stomp = {
            event_type: EventTypes.GAME_FIELD,
            payload: { ...updateResult },
          };
          fastify.roomManager.notifyAll(
            data.roomId,
            JSON.stringify(updateResponse),
          );
          return;
        }
      });
      // 切断動作は適当にしている
      socket.on("close", () => {
        fastify.roomManager.deleteUser(socket);
      });
    },
  );
}
