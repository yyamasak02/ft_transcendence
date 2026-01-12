import type { FastifyInstance } from "fastify";
import { WebSocket } from "@fastify/websocket";

type UserInput = "up" | "down" | "stop";
type GameStatus = "countdown" | "playing" | "ended";

type GameState = {
  roomId: string;
  status: GameStatus;
  countdown: number;
  players: {
    p1: { x: number; y: number; velocity: number };
    p2: { x: number; y: number; velocity: number };
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
const PADDLE_X_INITIAL = 0.97; // initial paddle x position near edges
const BALL_X_LIMIT = 1.05; // scoring threshold
const TICK_MS = 33;
const WINNING_SCORE = 5;
const GAME_DELAY_TIME = 2000;
const INITIAL_COUNTDOWN_SECONDS = 3;
const BALL_DEFLECTION_FACTOR = 0.05;
const BALL_INITIAL_VY_RATIO = 0.6; // Vertical velocity ratio for game start
const BALL_RESET_VY_RATIO = 0.5;
// Rally rush settings (matches frontend)
const RALLY_LEVEL_STEP = 10;
const RALLY_ADVANCE_PER_LEVEL = 1.5;
const RALLY_MAX_ADVANCE = 25.0;
const RALLY_NORMALIZATION_FACTOR = 30; // COURT_WIDTH / 2

// Calculate paddle x position based on rally count
const calculatePaddleX = (rallyCount: number, side: "p1" | "p2"): number => {
  const level = Math.floor(rallyCount / RALLY_LEVEL_STEP);
  if (level <= 0) {
    return side === "p1" ? PADDLE_X_INITIAL : -PADDLE_X_INITIAL;
  }
  const advance = Math.min(level * RALLY_ADVANCE_PER_LEVEL, RALLY_MAX_ADVANCE);
  const normalizedAdvance = advance / RALLY_NORMALIZATION_FACTOR;
  return side === "p1"
    ? PADDLE_X_INITIAL - normalizedAdvance
    : -PADDLE_X_INITIAL + normalizedAdvance;
};

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
      p1: { x: state.players.p1.x, y: state.players.p1.y, velocity: 0 },
      p2: { x: state.players.p2.x, y: state.players.p2.y, velocity: 0 },
    },
    ball: {
      x: state.ball.x,
      y: state.ball.y,
      vx: state.ball.vx,
      vy: state.ball.vy,
    },
    score: { p1: state.score.p1, p2: state.score.p2 },
    rallyCount: state.rallyCount,
  });

  const resetAfterScore = (state: GameState, dir: 1 | -1) => {
    state.status = "countdown";
    state.countdown = INITIAL_COUNTDOWN_SECONDS;
    state.rallyCount = 0;
    state.players.p1.x = calculatePaddleX(0, "p1");
    state.players.p2.x = calculatePaddleX(0, "p2");
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
          p1: { x: calculatePaddleX(0, "p1"), y: 0, velocity: 0 },
          p2: { x: calculatePaddleX(0, "p2"), y: 0, velocity: 0 },
        },
        ball: {
          x: 0,
          y: 0,
          vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
          vy:
            BALL_SPEED * BALL_INITIAL_VY_RATIO * (Math.random() > 0.5 ? 1 : -1),
        },
        score: { p1: 0, p2: 0 },
        rallyCount: 0,
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
    state.players.p1.x = calculatePaddleX(state.rallyCount, "p1");
    state.players.p2.x = calculatePaddleX(state.rallyCount, "p2");

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
    const HIT_EPSILON = 0.05;
    const isReflect = (
      ballX: number,
      ballY: number,
      ballVx: number,
      paddleX: number,
      paddleY: number,
      hit_epsilon: number,
    ) => {
      if ((ballVx < 0 && paddleX > 0) || (ballVx > 0 && paddleX < 0)) {
        return false;
      }
      const hitX =
        ballVx < 0
          ? ballX <= paddleX && ballX >= paddleX - hit_epsilon
          : ballX >= paddleX && ballX <= paddleX + hit_epsilon;
      if (!hitX) return false;
      return Math.abs(ballY - paddleY) <= PADDLE_HITBOX;
    };
    // paddle collision
    // player2のパドル反射判定
    if (
      isReflect(
        state.ball.x,
        state.ball.y,
        state.ball.vx,
        state.players.p2.x,
        state.players.p2.y,
        HIT_EPSILON,
      )
    ) {
      state.ball.x = state.players.p2.x;
      state.ball.vx = Math.abs(state.ball.vx);
      const delta = state.ball.y - state.players.p2.y;
      state.ball.vy += delta * BALL_DEFLECTION_FACTOR;
      state.rallyCount++;
    }
    // player1のパドル反射判定
    if (
      isReflect(
        state.ball.x,
        state.ball.y,
        state.ball.vx,
        state.players.p1.x,
        state.players.p1.y,
        HIT_EPSILON,
      )
    ) {
      state.ball.x = state.players.p1.x;
      state.ball.vx = -Math.abs(state.ball.vx);
      const delta = state.ball.y - state.players.p1.y;
      state.ball.vy += delta * BALL_DEFLECTION_FACTOR;
      state.rallyCount++;
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
