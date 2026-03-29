import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import {
  PaddleProperties,
  BallProperties,
  GameProperties,
  type GameConfig,
  type GameState,
  type UserInput,
} from "../constants/game_const.js";
import {
  GAME_STATUS,
  DIRECTION,
  PLAYER,
  MSG,
  type ConnectMsg,
  type GameReadyMsg,
  type InputPaddleMsg,
  type GameEndPayload,
} from "../../schemas/ws.js";
import { ROOM_STATUS } from "../../schemas/rooms.js";
import {
  calculatePaddleX,
  checkPaddleHit,
  serializeGameState,
  createInitialGameState,
} from "../logic/message_logic.js";
import type { RoomSession } from "../../plugins/app/gameSessions.js";

export class GameService {
  private readonly _fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this._fastify = fastify;
  }

  // ── Socket registration ──────────────────────────────────────────────

  registerSocket(msg: ConnectMsg, socket: WebSocket): void {
    const session = this._fastify.gameSessions.getOrCreate(msg.roomId);
    session.sockets.set(msg.userId, socket);
  }

  // ── Game lifecycle ───────────────────────────────────────────────────

  markReadyAndMaybeStart(msg: GameReadyMsg): void {
    const session = this._fastify.gameSessions.getOrCreate(msg.roomId);
    session.readyUsers.add(msg.userId);

    // Store puid and merge settings from the first ready message per player
    const room = this._fastify.simpleRooms.get(msg.roomId);
    if (!room || room.status !== ROOM_STATUS.MATCHED || !room.guestUserId)
      return;

    if (msg.userId === room.hostUserId) {
      session.hostPuid = msg.userPuid;
    } else if (msg.userId === room.guestUserId) {
      session.guestPuid = msg.userPuid;
    }

    if (msg.settings && msg.userId === room.hostUserId) {
      // ballSpeed はフロントエンドから倍率(1=等倍)で届くので正規化速度に変換する
      session.gameConfig = {
        winningScore: msg.settings.winningScore,
        ballSpeed: msg.settings.ballSpeed * BallProperties.SPEED,
      };
    }

    if (!session.isReadyToStart(room.hostUserId, room.guestUserId)) return;
    if (session.isStarted()) return;

    session.started = true;

    this._sendCountdown(session);
    setTimeout(() => {
      const currentRoom = this._fastify.simpleRooms.get(msg.roomId);
      if (!currentRoom) return;
      session.gameState = createInitialGameState(
        msg.roomId,
        session.gameConfig,
      );
      session.loop = setInterval(
        () => this._tick(msg.roomId),
        GameProperties.TICK_MS,
      );
    }, GameProperties.DELAY_TIME);
  }

  handleInputPaddle(msg: InputPaddleMsg): void {
    const room = this._fastify.simpleRooms.get(msg.roomId);
    if (!room || !room.guestUserId) return;

    const session = this._fastify.gameSessions.get(msg.roomId);
    if (!session) return;

    if (msg.userId === room.hostUserId)
      session.inputs.p1 = msg.payload.direction;
    else if (msg.userId === room.guestUserId)
      session.inputs.p2 = msg.payload.direction;
  }

  handleDisconnect(socket: WebSocket): void {
    for (const [roomId, session] of this._fastify.gameSessions) {
      for (const [uid, ws] of session.sockets) {
        if (ws === socket) {
          session.sockets.delete(uid);
        }
      }
      // ゲーム開始済みの場合は削除しない。
      // 待機画面→ゲームページへの画面遷移でソケットが一時的に空になるため、
      // ゲームページのソケットが再登録されるまでセッションを保持する。
      if (session.isEmpty() && !session.isStarted()) {
        if (session.isLoopRunning()) clearInterval(session.loop!);
        this._fastify.gameSessions.delete(roomId);
      }
    }
  }

  // ── Broadcast helpers ────────────────────────────────────────────────

  private _sendCountdown(session: RoomSession): void {
    this._broadcast(session, { type: MSG.GAME_COUNTDOWN });
  }

  private _broadcast(session: RoomSession, data: unknown): void {
    const str = JSON.stringify(data);
    session.sockets.forEach((ws) => {
      try {
        ws.send(str);
      } catch {
        // noop
      }
    });
  }

  // ── Game tick ────────────────────────────────────────────────────────

  private _tick(roomId: string): void {
    const room = this._fastify.simpleRooms.get(roomId);
    if (!room?.guestUserId) return;

    const session = this._fastify.gameSessions.get(roomId);
    if (!session?.gameState) return;

    const state = session.gameState;

    this._updatePaddles(state, session.inputs);

    if (state.status === GAME_STATUS.COUNTDOWN) {
      state.countdown -= GameProperties.TICK_MS / 1000;
      if (state.countdown <= 0) {
        state.countdown = 0;
        state.status = GAME_STATUS.PLAYING;
      }
      this._broadcast(session, {
        type: MSG.GAME_STATE,
        payload: serializeGameState(state, []),
      });
      return;
    }

    if (state.status === GAME_STATUS.ENDED) return;

    const events = this._updateBallPhysics(state);
    this._updatePaddleCollisions(state);

    const isGameOver = this._updateScoring(state, session.gameConfig);
    if (isGameOver) {
      state.status = GAME_STATUS.ENDED;
      const winner =
        state.score.p1 >= session.gameConfig.winningScore
          ? PLAYER.P1
          : PLAYER.P2;
      const endPayload: GameEndPayload = {
        winner,
        score: { p1: state.score.p1, p2: state.score.p2 },
        hostPuid: session.hostPuid,
        guestPuid: session.guestPuid,
      };
      this._broadcast(session, { type: MSG.GAME_END, payload: endPayload });
      if (session.isLoopRunning()) clearInterval(session.loop!);
      session.loop = null;
      // ゲーム終了後にセッションを削除（handleDisconnect で削除されなくなったため）
      this._fastify.gameSessions.delete(roomId);
      return;
    }

    this._broadcast(session, {
      type: MSG.GAME_STATE,
      payload: serializeGameState(state, events),
    });
  }

  private _updatePaddles(
    state: GameState,
    inputs: { p1: UserInput; p2: UserInput },
  ): void {
    if (inputs.p1 === DIRECTION.UP)
      state.players.p1.y -= PaddleProperties.SPEED;
    else if (inputs.p1 === DIRECTION.DOWN)
      state.players.p1.y += PaddleProperties.SPEED;
    if (inputs.p2 === DIRECTION.UP)
      state.players.p2.y -= PaddleProperties.SPEED;
    else if (inputs.p2 === DIRECTION.DOWN)
      state.players.p2.y += PaddleProperties.SPEED;

    state.players.p1.y = Math.max(
      -PaddleProperties.Y_LIMIT,
      Math.min(PaddleProperties.Y_LIMIT, state.players.p1.y),
    );
    state.players.p2.y = Math.max(
      -PaddleProperties.Y_LIMIT,
      Math.min(PaddleProperties.Y_LIMIT, state.players.p2.y),
    );
    state.players.p1.x = calculatePaddleX(state.rallyCount, "p1");
    state.players.p2.x = calculatePaddleX(state.rallyCount, "p2");
  }

  private _updateBallPhysics(state: GameState): string[] {
    const events: string[] = [];
    // A2: ボール半径を考慮した壁境界
    const wallLimit = PaddleProperties.Y_LIMIT - BallProperties.SIZE / 2;

    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    if (state.ball.y > wallLimit) {
      state.ball.y = wallLimit;
      state.ball.vy *= -1;
      events.push("wall_hit"); // A3
    } else if (state.ball.y < -wallLimit) {
      state.ball.y = -wallLimit;
      state.ball.vy *= -1;
      events.push("wall_hit"); // A3
    }

    return events;
  }

  private _updatePaddleCollisions(state: GameState): void {
    if (
      checkPaddleHit(
        state.ball.x,
        state.ball.y,
        state.ball.vx,
        state.players.p2.x,
        state.players.p2.y,
      )
    ) {
      state.ball.x = state.players.p2.x;
      state.ball.vx = Math.abs(state.ball.vx);
      state.ball.vy +=
        (state.ball.y - state.players.p2.y) * BallProperties.DEFLECTION_FACTOR;
      state.rallyCount++;
    }
    if (
      checkPaddleHit(
        state.ball.x,
        state.ball.y,
        state.ball.vx,
        state.players.p1.x,
        state.players.p1.y,
      )
    ) {
      state.ball.x = state.players.p1.x;
      state.ball.vx = -Math.abs(state.ball.vx);
      state.ball.vy +=
        (state.ball.y - state.players.p1.y) * BallProperties.DEFLECTION_FACTOR;
      state.rallyCount++;
    }
  }

  // Returns true if the game is over after scoring
  private _updateScoring(state: GameState, config: GameConfig): boolean {
    if (state.ball.x < -BallProperties.X_LIMIT) {
      state.score.p1 += 1;
      this._applyScoreReset(state, +1, config.ballSpeed);
    } else if (state.ball.x > BallProperties.X_LIMIT) {
      state.score.p2 += 1;
      this._applyScoreReset(state, -1, config.ballSpeed);
    } else {
      return false;
    }
    return (
      state.score.p1 >= config.winningScore ||
      state.score.p2 >= config.winningScore
    );
  }

  private _applyScoreReset(
    state: GameState,
    dir: 1 | -1,
    ballSpeed: number,
  ): void {
    state.status = GAME_STATUS.COUNTDOWN;
    state.countdown = GameProperties.INITIAL_COUNTDOWN_SECONDS;
    state.rallyCount = 0;
    state.players.p1.x = calculatePaddleX(0, "p1");
    state.players.p2.x = calculatePaddleX(0, "p2");
    state.ball = {
      x: 0,
      y: 0,
      vx: ballSpeed * dir,
      vy:
        ballSpeed *
        BallProperties.RESET_VY_RATIO *
        (Math.random() > 0.5 ? 1 : -1),
    };
  }
}
