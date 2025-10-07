// src/core/constants.ts
export const TARGET_FPS = 60;
export const FIXED_TIME_STEP = 1000 / TARGET_FPS;
export const MAX_DELTA_TIME = FIXED_TIME_STEP * 5;
export let BASE_BALL_SPEED = 10;
export let WINNING_SCORE = 10;
export const BALL_SIZE = 10;
export const COUNTDOWN_INTERVAL = 1000;
export const FIREWORK_INTERVAL = 400;
export const CORE_HIT_RANGE = 0.2;
export const AI_TICK_RATE = 1000;

export function setBallSpeed(speed: number) {
  BASE_BALL_SPEED = Math.max(5, Math.min(15, speed));
}

export function setWinningScore(score: number) {
  WINNING_SCORE = Math.max(1, Math.min(50, score));
}