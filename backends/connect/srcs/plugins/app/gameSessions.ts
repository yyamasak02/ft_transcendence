import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { GameState, UserInput } from "../../game/constants/game_const.js";
import {
  type GameConfig,
  DEFAULT_GAME_CONFIG,
} from "../../game/constants/game_const.js";

export class RoomSession {
  // State variables
  readonly sockets = new Map<string, WebSocket>();
  readonly readyUsers = new Set<string>();
  inputs: { p1: UserInput; p2: UserInput } = { p1: "stop", p2: "stop" };
  loop: ReturnType<typeof setInterval> | null = null;
  gameState: GameState | null = null;
  started = false;
  gameConfig: GameConfig = { ...DEFAULT_GAME_CONFIG };
  hostPuid: string = "";
  guestPuid: string = "";

  // State checks
  isReadyToStart(hostId: string, guestId: string): boolean {
    return this.readyUsers.has(hostId) && this.readyUsers.has(guestId);
  }

  isStarted(): boolean {
    return this.started;
  }

  isEmpty(): boolean {
    return this.sockets.size === 0;
  }

  isLoopRunning(): boolean {
    return this.loop !== null;
  }
}

export class GameSessionManager {
  private readonly _sessions = new Map<string, RoomSession>();

  getOrCreate(roomId: string): RoomSession {
    let session = this._sessions.get(roomId);
    if (!session) {
      session = new RoomSession();
      this._sessions.set(roomId, session);
    }
    return session;
  }

  get(roomId: string): RoomSession | undefined {
    return this._sessions.get(roomId);
  }

  delete(roomId: string): void {
    this._sessions.delete(roomId);
  }

  [Symbol.iterator](): IterableIterator<[string, RoomSession]> {
    return this._sessions[Symbol.iterator]();
  }
}

declare module "fastify" {
  interface FastifyInstance {
    gameSessions: GameSessionManager;
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate("gameSessions", new GameSessionManager());
  },
  { name: "gameSessions", dependencies: ["simpleRooms"] },
);
