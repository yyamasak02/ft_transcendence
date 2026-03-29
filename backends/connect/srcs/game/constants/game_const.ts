export type { UserInput, GameStatus, GameState } from "../../schemas/ws.js";

export type GameConfig = {
  winningScore: number;
  ballSpeed: number;
};

// Tunables
export enum PaddleProperties {
  SPEED = 0.04, // normalized per tick
  Y_LIMIT = 1.0, // normalized half-height
  HITBOX = 0.25, // half length normalized
  X_INITIAL = 0.97, // initial paddle x position near edges
  COLLISION_TOLERANCE = 0.05, // tolerance for hit detection
}

export enum BallProperties {
  SIZE = 0.05, // diameter normalized
  SPEED = 0.02, // normalized per tick base
  X_LIMIT = 1.05, // scoring threshold
  DEFLECTION_FACTOR = 0.05,
  INITIAL_VY_RATIO = 0.6, // Vertical velocity ratio for game start
  RESET_VY_RATIO = 0.5,
}

export enum GameProperties {
  TICK_MS = 33,
  WINNING_SCORE = 5,
  DELAY_TIME = 5000,
  INITIAL_COUNTDOWN_SECONDS = 3,
  RALLY_LEVEL_STEP = 10,
  RALLY_ADVANCE_PER_LEVEL = 1.5,
  RALLY_MAX_ADVANCE = 25.0,
  RALLY_NORMALIZATION_FACTOR = 30, // COURT_WIDTH / 2
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  winningScore: GameProperties.WINNING_SCORE,
  ballSpeed: BallProperties.SPEED,
};
