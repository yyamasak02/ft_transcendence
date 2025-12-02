// src/core/constants.ts
export let BALL_SPEED_RATE = 0.5;
export let WINNING_SCORE = 5;
export const BALL_SIZE = 10;
export const COUNTDOWN_INTERVAL = 1000;

export function setBallSpeed(speed: number) {
  BALL_SPEED_RATE = Math.max(0.1, Math.min(1.0, speed));
}

export function setWinningScore(score: number) {
  WINNING_SCORE = Math.max(1, Math.min(50, score));
}

export const GAME_CONFIG = {
  COURT_WIDTH: 60,
  COURT_HEIGHT: 40,
  PADDLE_LENGTH: 8,
  PADDLE_THICKNESS: 1,
  BALL_RADIUS: 1,
};

export type GameConfig = typeof GAME_CONFIG;
