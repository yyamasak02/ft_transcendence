// pingpong_3D/types/game.ts
export type GamePhase = "menu" | "game" | "gameover" | "pause";
export type GameState = {
  phase: GamePhase;
  rallyActive: boolean;
  isServing: boolean;
  lastWinner: 1 | 2 | null;
};