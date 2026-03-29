import { Type, type Static } from "@sinclair/typebox";

// Placeholder for future query params
export const readyQuerySchema = Type.Object({});

// --- Message type literals (single source of truth for type strings) ---
const T_CONNECT = Type.Literal("connect");
const T_INPUT_PADDLE = Type.Literal("input:paddle");
const T_GAME_COUNTDOWN = Type.Literal("game:countdown");
const T_GAME_READY = Type.Literal("game:ready");
const T_GAME_END = Type.Literal("game:end");
const T_GAME_STATE = Type.Literal("game:state");

/** Switch-case 用定数。値はスキーマのリテラルから直接取得しているため二重管理にならない */
export const MSG = {
  CONNECT: T_CONNECT.const,
  INPUT_PADDLE: T_INPUT_PADDLE.const,
  GAME_COUNTDOWN: T_GAME_COUNTDOWN.const,
  GAME_READY: T_GAME_READY.const,
  GAME_END: T_GAME_END.const,
  GAME_STATE: T_GAME_STATE.const,
} as const;

const T_UP = Type.Literal("up");
const T_DOWN = Type.Literal("down");
const T_STOP = Type.Literal("stop");

export const DIRECTION = {
  UP: T_UP.const,
  DOWN: T_DOWN.const,
  STOP: T_STOP.const,
} as const;

const DirectionType = Type.Union([T_UP, T_DOWN, T_STOP]);

const T_P1 = Type.Literal("p1");
const T_P2 = Type.Literal("p2");

export const PLAYER = {
  P1: T_P1.const,
  P2: T_P2.const,
} as const;

const UserType = Type.Union([T_P1, T_P2]);

const T_COUNTDOWN = Type.Literal("countdown");
const T_PLAYING = Type.Literal("playing");
const T_ENDED = Type.Literal("ended");

export const GAME_STATUS = {
  COUNTDOWN: T_COUNTDOWN.const,
  PLAYING: T_PLAYING.const,
  ENDED: T_ENDED.const,
} as const;

const GameStatusType = Type.Union([T_COUNTDOWN, T_PLAYING, T_ENDED]);

const GameStateType = Type.Object({
  roomId: Type.String({ minLength: 1 }),
  status: GameStatusType,
  countdown: Type.Number(),
  players: Type.Object({
    p1: Type.Object({
      x: Type.Number(),
      y: Type.Number(),
    }),
    p2: Type.Object({
      x: Type.Number(),
      y: Type.Number(),
    }),
  }),
  ball: Type.Object({
    x: Type.Number(),
    y: Type.Number(),
    vx: Type.Number(),
    vy: Type.Number(),
  }),
  score: Type.Object({
    p1: Type.Number(),
    p2: Type.Number(),
  }),
  rallyCount: Type.Number(),
  events: Type.Array(Type.String()),
});

export type UserInput = Static<typeof DirectionType>;
export type GameStatus = Static<typeof GameStatusType>;
export type GameState = Static<typeof GameStateType>;

// --- Client → Server messages (used for validation in message_handler) ---
export const clientMessageSchema = Type.Union([
  Type.Object({
    type: T_CONNECT,
    userId: Type.String({ minLength: 1 }),
    roomId: Type.String({ minLength: 1 }),
  }),
  Type.Object({
    type: T_INPUT_PADDLE,
    userId: Type.String({ minLength: 1 }),
    roomId: Type.String({ minLength: 1 }),
    payload: Type.Object({
      direction: DirectionType,
    }),
  }),
  Type.Object({
    type: T_GAME_READY,
    userId: Type.String({ minLength: 1 }),
    roomId: Type.String({ minLength: 1 }),
    userPuid: Type.String({ minLength: 1 }),
    settings: Type.Optional(
      Type.Object({
        winningScore: Type.Number({ minimum: 1 }),
        ballSpeed: Type.Number({ minimum: 0 }),
      }),
    ),
  }),
]);

export type WsClientMessage = Static<typeof clientMessageSchema>;
export type ConnectMsg = Extract<WsClientMessage, { type: "connect" }>;
export type GameReadyMsg = Extract<WsClientMessage, { type: "game:ready" }>;
export type InputPaddleMsg = Extract<WsClientMessage, { type: "input:paddle" }>;

// --- Server → Client message payload types ---
export type GameEndPayload = {
  winner: "p1" | "p2";
  score: { p1: number; p2: number };
  hostPuid: string;
  guestPuid: string;
};
