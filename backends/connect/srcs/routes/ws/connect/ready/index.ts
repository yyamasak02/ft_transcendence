import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { WebSocket } from "@fastify/websocket";

type ConnKey = string; // `${roomId}:${userId}`

export default async function (fastify: FastifyInstance) {
  // simpleRooms plugin is autoloaded in app.ts

  const roomSockets = new Map<string, Map<string, WebSocket>>();
  const readyUsers = new Map<string, Set<string>>();
  const roomInputs = new Map<
    string,
    { p1: "up" | "down" | "stop"; p2: "up" | "down" | "stop" }
  >();
  const roomLoops = new Map<
    string,
    {
      timer: ReturnType<typeof setInterval>;
      status: "countdown" | "playing" | "ended";
    }
  >();
  const startedRooms = new Set<string>();

  type GameState = {
    roomId: string;
    status: "countdown" | "playing" | "ended";
    countdown: number;
    players: {
      p1: { y: number; velocity: number };
      p2: { y: number; velocity: number };
    };
    ball: { x: number; y: number; vx: number; vy: number };
    score: { p1: number; p2: number };
  };

  const gameStates = new Map<string, GameState>();

  const PADDLE_SPEED = 0.04; // normalized per tick
  const BALL_SPEED = 0.02; // normalized per tick base
  const PADDLE_Y_LIMIT = 1.0; // normalized half-height
  const PADDLE_HITBOX = 0.25; // half length normalized
  const PADDLE_X = 0.9; // near edges
  const BALL_X_LIMIT = 1.05; // scoring threshold
  const TICK_MS = 33;
  const WINNING_SCORE = 5;

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
      } catch {}
    });
    // start loop after short delay
    setTimeout(() => startGameLoop(roomId), 2000);
  };

  function startGameLoop(roomId: string) {
    const room = fastify.simpleRooms.get(roomId);
    if (!room || !room.guestUserId) return;
    const state: GameState = {
      roomId,
      status: "countdown",
      countdown: 3,
      players: {
        p1: { y: 0, velocity: 0 },
        p2: { y: 0, velocity: 0 },
      },
      ball: { x: 0, y: 0, vx: BALL_SPEED, vy: BALL_SPEED * 0.6 },
      score: { p1: 0, p2: 0 },
    };
    gameStates.set(roomId, state);
    const sockets = roomSockets.get(roomId);
    if (!sockets) return;
    const timer = setInterval(() => tick(roomId), TICK_MS);
    roomLoops.set(roomId, { timer, status: "countdown" });
  }

  function broadcast(roomId: string, data: any) {
    const sockets = roomSockets.get(roomId);
    if (!sockets) return;
    const payload = JSON.stringify(data);
    sockets.forEach((ws) => {
      try {
        ws.send(payload);
      } catch {}
    });
  }

  function tick(roomId: string) {
    const room = fastify.simpleRooms.get(roomId);
    if (!room || !room.guestUserId) return;
    const state = gameStates.get(roomId);
    if (!state) return;

    // Get inputs (needed for both countdown and playing phases to update paddle positions)
    const inputs = roomInputs.get(roomId) ?? { p1: "stop", p2: "stop" };

    // Update paddle positions based on inputs (works in all phases)
    const p1Dir = inputs.p1;
    const p2Dir = inputs.p2;
    if (p1Dir === "up") state.players.p1.y -= PADDLE_SPEED;
    else if (p1Dir === "down") state.players.p1.y += PADDLE_SPEED;
    if (p2Dir === "up") state.players.p2.y -= PADDLE_SPEED;
    else if (p2Dir === "down") state.players.p2.y += PADDLE_SPEED;
    state.players.p1.y = Math.max(
      -PADDLE_Y_LIMIT,
      Math.min(PADDLE_Y_LIMIT, state.players.p1.y),
    );
    state.players.p2.y = Math.max(
      -PADDLE_Y_LIMIT,
      Math.min(PADDLE_Y_LIMIT, state.players.p2.y),
    );

    // Handle countdown phase
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

    // Handle ended phase
    if (state.status === "ended") return;

    // Handle playing phase (ball physics, collision, scoring)
    // update ball
    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;
    // wall bounce
    if (state.ball.y > PADDLE_Y_LIMIT) {
      state.ball.y = PADDLE_Y_LIMIT;
      state.ball.vy *= -1;
    }
    if (state.ball.y < -PADDLE_Y_LIMIT) {
      state.ball.y = -PADDLE_Y_LIMIT;
      state.ball.vy *= -1;
    }
    // paddle collision
    // left paddle
    if (state.ball.x < -PADDLE_X && state.ball.x > -PADDLE_X - 0.05) {
      if (Math.abs(state.ball.y - state.players.p2.y) <= PADDLE_HITBOX) {
        state.ball.x = -PADDLE_X;
        state.ball.vx = Math.abs(state.ball.vx);
        // tweak vy based on impact
        const delta = state.ball.y - state.players.p2.y;
        state.ball.vy += delta * 0.05;
      }
    }
    // right paddle
    if (state.ball.x > PADDLE_X && state.ball.x < PADDLE_X + 0.05) {
      if (Math.abs(state.ball.y - state.players.p1.y) <= PADDLE_HITBOX) {
        state.ball.x = PADDLE_X;
        state.ball.vx = -Math.abs(state.ball.vx);
        const delta = state.ball.y - state.players.p1.y;
        state.ball.vy += delta * 0.05;
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
    // end game
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
  }

  function resetAfterScore(state: GameState, dir: 1 | -1) {
    state.status = "countdown";
    state.countdown = 3;
    state.ball.x = 0;
    state.ball.y = 0;
    state.ball.vx = BALL_SPEED * dir;
    state.ball.vy = BALL_SPEED * 0.5 * (Math.random() > 0.5 ? 1 : -1);
  }

  function snapshot(state: GameState) {
    return {
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
    };
  }

  const querySchema = Type.Object({});

  const handler = async (socket: WebSocket) => {
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
      } catch (e) {
        // ignore invalid json
      }
    });

    socket.on("close", () => {
      // best-effort cleanup
      for (const [roomId, m] of roomSockets) {
        for (const [uid, ws] of m) {
          if (ws === socket) m.delete(uid);
        }
        if (m.size === 0) {
          roomSockets.delete(roomId);
          readyUsers.delete(roomId);
        }
      }
    });
  };

  // Mounted relative to folder-based route prefix (/ws/connect/ready)
  fastify.get(
    "/",
    { websocket: true, schema: { querystring: querySchema } },
    handler,
  );
}
