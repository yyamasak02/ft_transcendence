import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { WebSocket } from "@fastify/websocket";
import { RoomStatus } from "../../types/consts.js";
import { RoomInfo, UserInfo } from "../../types/room_type.js";
import { v4 as uuidv4 } from "uuid";
import { GameState } from "../../game/GameState.js";
export class RoomManager {
  private _rooms = new Map<string, RoomInfo>();
  private _socketToUserInfo = new Map<WebSocket, UserInfo>();

  addRoom(userId: string, socket: WebSocket): string | null {
    const roomId: string = uuidv4();
    if (this._rooms.has(roomId)) {
      return null;
    }
    const userInfo: UserInfo = {
      userId: userId,
      socket: socket,
      isHost: true,
      joinRoomId: roomId,
    };
    const roomInfo: RoomInfo = {
      roomId: roomId,
      status: RoomStatus.WAITING,
      hostUserId: userId,
      users: new Map<string, UserInfo>(),
    };
    roomInfo.users.set(userId, userInfo);
    this._rooms.set(roomId, roomInfo);
    return roomId;
  }

  getRoomStatus(
    roomId: string,
  ): (typeof RoomStatus)[keyof typeof RoomStatus] | null {
    const roomInfo = this._rooms.get(roomId);
    if (!roomInfo) return null;
    return roomInfo.status;
  }

  setRoomStatus(
    roomId: string,
    roomStatus: (typeof RoomStatus)[keyof typeof RoomStatus],
  ): undefined {
    const roomInfo = this._rooms.get(roomId);
    if (!roomInfo) return;
    roomInfo.status = roomStatus;
  }

  addUser(roomId: string, userId: string, socket: WebSocket) {
    let userInfo: UserInfo = {
      userId: userId,
      socket: socket,
      isHost: false,
      joinRoomId: roomId,
    };
    this.findRoomInfoByRoomId(roomId)?.users.set(userId, userInfo);
    this._socketToUserInfo.set(socket, userInfo);
  }

  getHostUser(roomId: string) {
    const roomInfo = this.findRoomInfoByRoomId(roomId);
    if (!roomInfo) return;
    return roomInfo.users.get(roomInfo.hostUserId);
  }

  deleteRoom(roomId: string) {
    if (this._rooms.has(roomId)) {
      this._rooms.delete(roomId);
    }
  }

  deleteUser(socket: WebSocket) {
    const userInfo = this._socketToUserInfo.get(socket);
    if (!userInfo) return;
    const room = this._rooms.get(userInfo.joinRoomId);
    room?.users.delete(userInfo.userId);
    this._socketToUserInfo.delete(socket);
  }

  findRoomInfoByRoomId(roomId: string) {
    return this._rooms.get(roomId);
  }

  findUserInfoByWebSocket(socket: WebSocket) {
    return this._socketToUserInfo.get(socket);
  }

  notifyAll(roomId: string, message: string) {
    const roomInfo = this._rooms.get(roomId);
    if (!roomInfo) return;
    roomInfo.users.forEach((userInfo) => userInfo.socket.send(message));
  }

  startGame(roomId: string) {
    const roomInfo = this._rooms.get(roomId);
    if (!roomInfo) return;
    roomInfo.game = new GameState(
      [...roomInfo.users.values()].map((u) => u.userId),
    );
    return roomInfo.game.getGameStateInfo();
  }

  updateGame(roomId: string, userId: string, key: string) {
    const roomInfo = this._rooms.get(roomId);
    if (!roomInfo || !roomInfo.game) return;
    return roomInfo.game.update(userId, key);
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate("roomManager", new RoomManager());
  },
  {
    name: "roomManager",
  },
);
