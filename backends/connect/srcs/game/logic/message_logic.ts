import {
  PaddleProperties,
  BallProperties,
  GameProperties,
  type GameConfig,
  type GameState,
} from "../constants/game_const.js";
import { GAME_STATUS } from "../../schemas/ws.js";

export const calculatePaddleX = (
  rallyCount: number,
  side: "p1" | "p2",
): number => {
  const level = Math.floor(rallyCount / GameProperties.RALLY_LEVEL_STEP);
  if (level <= 0) {
    return side === "p1"
      ? PaddleProperties.X_INITIAL
      : -PaddleProperties.X_INITIAL;
  }
  const advance = Math.min(
    level * GameProperties.RALLY_ADVANCE_PER_LEVEL,
    GameProperties.RALLY_MAX_ADVANCE,
  );
  const normalizedAdvance = advance / GameProperties.RALLY_NORMALIZATION_FACTOR;
  return side === "p1"
    ? PaddleProperties.X_INITIAL - normalizedAdvance
    : -PaddleProperties.X_INITIAL + normalizedAdvance;
};

export const checkPaddleHit = (
  ballX: number,
  ballY: number,
  ballVx: number,
  paddleX: number,
  paddleY: number,
): boolean => {
  if ((ballVx < 0 && paddleX > 0) || (ballVx > 0 && paddleX < 0)) {
    return false;
  }
  const tol = PaddleProperties.COLLISION_TOLERANCE;
  const hitX =
    ballVx < 0
      ? ballX <= paddleX && ballX >= paddleX - tol
      : ballX >= paddleX && ballX <= paddleX + tol;
  if (!hitX) return false;
  return Math.abs(ballY - paddleY) <= PaddleProperties.HITBOX;
};

export const serializeGameState = (state: GameState, events: string[]) => ({
  roomId: state.roomId,
  status: state.status,
  countdown: state.countdown,
  players: {
    p1: { x: state.players.p1.x, y: state.players.p1.y },
    p2: { x: state.players.p2.x, y: state.players.p2.y },
  },
  ball: {
    x: state.ball.x,
    y: state.ball.y,
    vx: state.ball.vx,
    vy: state.ball.vy,
  },
  score: { p1: state.score.p1, p2: state.score.p2 },
  rallyCount: state.rallyCount,
  events,
});

export const createInitialGameState = (
  roomId: string,
  config: GameConfig,
): GameState => ({
  roomId,
  status: GAME_STATUS.COUNTDOWN,
  countdown: GameProperties.INITIAL_COUNTDOWN_SECONDS,
  players: {
    p1: { x: calculatePaddleX(0, "p1"), y: 0 },
    p2: { x: calculatePaddleX(0, "p2"), y: 0 },
  },
  ball: {
    x: 0,
    y: 0,
    vx: config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
    vy:
      config.ballSpeed *
      BallProperties.INITIAL_VY_RATIO *
      (Math.random() > 0.5 ? 1 : -1),
  },
  score: { p1: 0, p2: 0 },
  rallyCount: 0,
  events: [],
});
