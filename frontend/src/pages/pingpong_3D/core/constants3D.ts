// src/core/constants.ts
let BALL_SPEED = 50;
let WINNING_SCORE = 5;

export function getBallSpeed() {
  return BALL_SPEED;
}
export function setBallSpeed(value: number) {
	BALL_SPEED = value;
}

export function getWinningScore() {
	return WINNING_SCORE;
}
export function setWinningScore(value: number) {
  WINNING_SCORE = value;
}

export const GAME_CONFIG = {
  COURT_WIDTH: 60,
  COURT_HEIGHT: 40,
  PADDLE_THICKNESS: 1,
  BALL_RADIUS: 1,
};

export type GameConfig = typeof GAME_CONFIG;
