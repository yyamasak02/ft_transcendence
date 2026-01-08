import type { FastifyInstance } from "fastify";
import { WebSocket } from "@fastify/websocket";

type UserInput = "up" | "down" | "stop";
type GameStatus = "countdown" | "playing" | "ended";

type GameState = {
  roomId: string;
  status: GameStatus;
  countdown: number;
  players: {
    p1: { y: number; velocity: number };
    p2: { y: number; velocity: number };
  };
  ball: { x: number; y: number; vx: number; vy: number };
  score: { p1: number; p2: number };
  rallyCount: number;
};

// Tunables
const PADDLE_SPEED = 0.04; // normalized per tick
const BALL_SPEED = 0.02; // normalized per tick base
const PADDLE_Y_LIMIT = 1.0; // normalized half-height
const PADDLE_HITBOX = 0.25; // half length normalized
const PADDLE_X = 0.9; // near edges
const BALL_X_LIMIT = 1.05; // scoring threshold
const TICK_MS = 33;
const WINNING_SCORE = 5;
const GAME_DELAY_TIME = 2000;
const INITIAL_COUNTDOWN_SECONDS = 3;
const BALL_DEFLECTION_FACTOR = 0.05;
const BALL_INITIAL_VY_RATIO = 0.6; // Vertical velocity ratio for game start
const BALL_RESET_VY_RATIO = 0.5;

export function makeReadyWsHandler(fastify: FastifyInstance) {
  const roomSockets = new Map<string, Map<string, WebSocket>>();
  const readyUsers = new Map<string, Set<string>>();
  const roomInputs = new Map<string, { p1: UserInput; p2: UserInput }>();
  const roomLoops = new Map<
    string,
    { timer: ReturnType<typeof setInterval>; status: GameStatus }
  >();
  const startedRooms = new Set<string>();
  const gameStates = new Map<string, GameState>();

  const registerSocket = (
    roomId: string,
    userId: string,
    socket: WebSocket,
  ) => {
    const m = roomSockets.get(roomId) ?? new Map<string, WebSocket>();
    m.set(userId, socket);
    roomSockets.set(roomId, m);
    if (!roomInputs.has(roomId))
      roomInputs.set(roomId, { p1: "stop", p2: "stop" });
  };

  const broadcast = (roomId: string, data: unknown) => {
    const sockets = roomSockets.get(roomId);
    if (!sockets) return;
    const str = JSON.stringify(data);
    sockets.forEach((ws) => {
      try {
        ws.send(str);
      } catch {
        /* noop */
      }
    });
  };

  const snapshot = (state: GameState) => ({
    roomId: state.roomId,
    status: state.status,
    countdown: state.countdown,
    players: {
      p1: { y: state.players.p1.y, velocity: 0 },
      p2: { y: state.players.p2.y, velocity: 0 },
    },
    ball: {
      x: state.ball.x,
      y: state.ball.y,
      vx: state.ball.vx,
      vy: state.ball.vy,
    },
    score: { p1: state.score.p1, p2: state.score.p2 },
    rallyCount: state.rallyCount, // ★追加: クライアントへ送信
  });

  const resetAfterScore = (state: GameState, dir: 1 | -1) => {
    state.status = "countdown";
    state.countdown = INITIAL_COUNTDOWN_SECONDS;
    state.rallyCount = 0; // ★追加: 得点が入ったらラリーリセット
    state.ball.x = 0;
    state.ball.y = 0;
    state.ball.vx = BALL_SPEED * dir;
    state.ball.vy =
      BALL_SPEED *
      BALL_RESET_VY_RATIO *
      (Math.random() > BALL_RESET_VY_RATIO ? 1 : -1);
  };

  const markReadyAndMaybeStart = (roomId: string, userId: string) => {
    const r = readyUsers.get(roomId) ?? new Set<string>();
    r.add(userId);
    readyUsers.set(roomId, r);

    const room = fastify.simpleRooms.get(roomId);
    if (!room || room.status !== "matched" || !room.guestUserId) return;
    const both = r.has(room.hostUserId) && r.has(room.guestUserId);
    if (!both) return;

    if (startedRooms.has(roomId)) return;
    startedRooms.add(roomId);
    const sockets = roomSockets.get(roomId);
    if (!sockets) return;

    // notify countdown
    const countdownMsg = JSON.stringify({ type: "game:countdown" });
    sockets.forEach((ws) => {
      try {
        ws.send(countdownMsg);
      } catch {
        // TODO error handling
      }
    });

    setTimeout(() => {
      const room = fastify.simpleRooms.get(roomId);
      if (!room) return;

      const state: GameState = {
        roomId,
        status: "countdown",
        countdown: INITIAL_COUNTDOWN_SECONDS,
        players: {
          p1: { y: 0, velocity: 0 },
          p2: { y: 0, velocity: 0 },
        },
        ball: {
          x: 0,
          y: 0,
          vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
          vy:
            BALL_SPEED * BALL_INITIAL_VY_RATIO * (Math.random() > 0.5 ? 1 : -1),
        },
        score: { p1: 0, p2: 0 },
        rallyCount: 0, // ★追加: 初期化
      };
      gameStates.set(roomId, state);

      const interval = setInterval(() => tick(roomId), TICK_MS);
      roomLoops.set(roomId, { timer: interval, status: "countdown" });
    }, GAME_DELAY_TIME);
  };

  const tick = (roomId: string) => {
    const room = fastify.simpleRooms.get(roomId);
    if (!room || !room.guestUserId) return;
    const state = gameStates.get(roomId);
    if (!state) return;

    const input = roomInputs.get(roomId) ?? { p1: "stop", p2: "stop" };
    // update players
    if (input.p1 === "up") state.players.p1.y -= PADDLE_SPEED;
    else if (input.p1 === "down") state.players.p1.y += PADDLE_SPEED;
    if (input.p2 === "up") state.players.p2.y -= PADDLE_SPEED;
    else if (input.p2 === "down") state.players.p2.y += PADDLE_SPEED;
    state.players.p1.y = Math.max(
      -PADDLE_Y_LIMIT,
      Math.min(PADDLE_Y_LIMIT, state.players.p1.y),
    );
    state.players.p2.y = Math.max(
      -PADDLE_Y_LIMIT,
      Math.min(PADDLE_Y_LIMIT, state.players.p2.y),
    );

    if (state.status === "countdown") {
      state.countdown -= TICK_MS / 1000;
      if (state.countdown <= 0) {
        state.countdown = 0;
        state.status = "playing";
        const loop = roomLoops.get(roomId);
        if (loop) loop.status = "playing";
      }
      broadcast(roomId, { type: "game:state", payload: snapshot(state) });
      return;
    }

    if (state.status === "ended") return;

    // ball physics
    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;
    if (state.ball.y > PADDLE_Y_LIMIT) {
      state.ball.y = PADDLE_Y_LIMIT;
      state.ball.vy *= -1;
    }
    if (state.ball.y < -PADDLE_Y_LIMIT) {
      state.ball.y = -PADDLE_Y_LIMIT;
      state.ball.vy *= -1;
    }
    // paddle collision
    if (state.ball.x < -PADDLE_X && state.ball.x > -PADDLE_X - 0.05) {
      if (Math.abs(state.ball.y - state.players.p2.y) <= PADDLE_HITBOX) {
        state.ball.x = -PADDLE_X;
        state.ball.vx = Math.abs(state.ball.vx);
        const delta = state.ball.y - state.players.p2.y;
        state.ball.vy += delta * BALL_DEFLECTION_FACTOR;
        state.rallyCount++; // ★追加: 左パドル衝突でカウントアップ
      }
    }
    if (state.ball.x > PADDLE_X && state.ball.x < PADDLE_X + 0.05) {
      if (Math.abs(state.ball.y - state.players.p1.y) <= PADDLE_HITBOX) {
        state.ball.x = PADDLE_X;
        state.ball.vx = -Math.abs(state.ball.vx);
        const delta = state.ball.y - state.players.p1.y;
        state.ball.vy += delta * BALL_DEFLECTION_FACTOR;
        state.rallyCount++; // ★追加: 右パドル衝突でカウントアップ
      }
    }
    // scoring
    if (state.ball.x < -BALL_X_LIMIT) {
      state.score.p1 += 1;
      resetAfterScore(state, +1);
    } else if (state.ball.x > BALL_X_LIMIT) {
      state.score.p2 += 1;
      resetAfterScore(state, -1);
    }
    if (state.score.p1 >= WINNING_SCORE || state.score.p2 >= WINNING_SCORE) {
      state.status = "ended";
      broadcast(roomId, {
        type: "game:end",
        payload: { winner: state.score.p1 >= WINNING_SCORE ? "p1" : "p2" },
      });
      const loop = roomLoops.get(roomId);
      if (loop) clearInterval(loop.timer);
      roomLoops.delete(roomId);
      return;
    }
    broadcast(roomId, { type: "game:state", payload: snapshot(state) });
  };

  // WebSocket handler
  return (socket: WebSocket) => {
    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.type === "connect" && msg.roomId && msg.userId) {
          registerSocket(msg.roomId, msg.userId, socket);
          return;
        }
        if (msg?.type === "game:ready" && msg.roomId && msg.userId) {
          markReadyAndMaybeStart(msg.roomId, msg.userId);
          return;
        }
        if (
          msg?.type === "input:paddle" &&
          msg.roomId &&
          msg.userId &&
          msg.payload &&
          typeof msg.payload.direction === "string"
        ) {
          const { roomId, userId } = msg as { roomId: string; userId: string };
          const room = fastify.simpleRooms.get(roomId);
          if (!room || !room.guestUserId) return;
          const input = roomInputs.get(roomId) ?? { p1: "stop", p2: "stop" };
          if (userId === room.hostUserId) input.p1 = msg.payload.direction;
          else if (userId === room.guestUserId)
            input.p2 = msg.payload.direction;
          roomInputs.set(roomId, input);
          return;
        }
      } catch {
        // ignore invalid json
      }
    });

    socket.on("close", () => {
      for (const [roomId, m] of roomSockets) {
        for (const [uid, ws] of m) {
          if (ws === socket) {
            m.delete(uid);
            if (m.size === 0) {
              const loop = roomLoops.get(roomId);
              if (loop) {
                clearInterval(loop.timer);
                roomLoops.delete(roomId);
              }
            }
          }
        }
        if (m.size === 0) {
          roomSockets.delete(roomId);
          readyUsers.delete(roomId);
          gameStates.delete(roomId);
          roomInputs.delete(roomId);
          startedRooms.delete(roomId);
        }
      }
    });
  };
}
