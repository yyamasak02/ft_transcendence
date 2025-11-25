// src/core/state.ts

import { gameData, stages, canvas, type GameState } from "./data";
import {
  updateCharacterImages,
  toggleUIElements,
  applyCharacterStats,
} from "../ui/ui";

export function setGameState(newState: GameState) {
  gameData.previousGameState = gameData.gameState;
  gameData.gameState = newState;
}

export function setCountdown(newCountdown: number) {
  gameData.countdown = newCountdown;
}

export function setPlayer1CharIndex(index: number) {
  gameData.player1CharIndex = index;
  updateCharacterImages();
}

export function setPlayer2CharIndex(index: number) {
  gameData.player2CharIndex = index;
  updateCharacterImages();
}

export function setPlayer1Ready(ready: boolean) {
  gameData.player1Ready = ready;
}

export function setPlayer2Ready(ready: boolean) {
  gameData.player2Ready = ready;
}

export function setPlayer2AILevel(
  level: "Player" | "AI: easy" | "AI: normal" | "AI: hard",
) {
  gameData.player2AILevel = level;
}

export function setSelectedStage(index: number) {
  if (index >= 0 && index < stages.length) {
    gameData.selectedStageIndex = index;
  }
}

export function resetBall() {
  gameData.ball.x = canvas.width / 2;
  gameData.ball.y = canvas.height / 2;
  gameData.ball.speedX = 0;
  gameData.ball.speedY = 0;
  gameData.ball.power = 1;
  gameData.gameState = "countingDown";
  gameData.countdown = 3;
}

export function handleCharacterSelection() {
  if (gameData.player1Ready && gameData.player2Ready) {
    setGameState("stageSelect");
    setPlayer1Ready(false);
    setPlayer2Ready(false);
  }
}

export function handleStageSelection() {
  applyCharacterStats();
  gameData.player1.stamina = gameData.player1.maxStamina;
  gameData.player2.stamina = gameData.player2.maxStamina;
  setGameState("countingDown");
  resetBall();
  toggleUIElements();
}
