// src/game.ts

import {
  gameData,
  canvas,
  characters,
  WINNING_SCORE,
  BASE_BALL_SPEED,
} from "./data";
import { setGameState } from "./play";
import { resetBall } from "./ui";

const CORE_HIT_RANGE = 0.2;

function checkCollision(ball: any, player: any) {
  let ballX = ball.x + ball.size / 2;
  let ballY = ball.y + ball.size / 2;
  let playerX = player.x;
  let playerY = player.y;
  let playerW = player.width;
  let playerH = player.height;

  let hit =
    ballX + ball.size / 2 > playerX &&
    ballX - ball.size / 2 < playerX + playerW &&
    ballY + ball.size / 2 > playerY &&
    ballY - ball.size / 2 < playerY + playerH;

  if (hit) {
    let collidePoint = ball.y + ball.size / 2 - (player.y + playerH / 2);
    collidePoint = collidePoint / (playerH / 2);
    let angleRad = (Math.PI / 4) * collidePoint;
    let direction = ball.x < canvas.width / 2 ? 1 : -1;

    let charIndex = player.isPlayer1
      ? gameData.player1CharIndex
      : gameData.player2CharIndex;
    let char = characters[charIndex];

    if (Math.abs(collidePoint) <= CORE_HIT_RANGE) {
      gameData.ball.power = char.power;
    } else {
      gameData.ball.power = 1;
    }
    let opponent = player.isPlayer1 ? gameData.player2 : gameData.player1;
    opponent.stamina = Math.max(0, opponent.stamina - gameData.ball.power * 5);
    let newSpeedX = BASE_BALL_SPEED * Math.cos(angleRad) * gameData.ball.power;
    let newSpeedY = BASE_BALL_SPEED * Math.sin(angleRad) * gameData.ball.power;

    ball.speedX = direction * newSpeedX;
    ball.speedY = newSpeedY;
  }
  return hit;
}

export function update() {
  gameData.ball.x += gameData.ball.speedX;
  gameData.ball.y += gameData.ball.speedY;

  if (
    gameData.ball.y + gameData.ball.size / 2 > canvas.height ||
    gameData.ball.y - gameData.ball.size / 2 < 0
  ) {
    gameData.ball.speedY = -gameData.ball.speedY;
  }
  if (gameData.ball.speedX < 0) {
    if (checkCollision(gameData.ball, gameData.player1)) {
      if (characters[gameData.player1CharIndex].name === "Gust") {
      }
    }
  } else if (gameData.ball.speedX > 0) {
    if (checkCollision(gameData.ball, gameData.player2)) {
      if (characters[gameData.player2CharIndex].name === "Gust") {
      }
    }
  }
  if (gameData.ball.x - gameData.ball.size / 2 < 0) {
    gameData.player2.score++;
    resetBall();
  } else if (gameData.ball.x + gameData.ball.size / 2 > canvas.width) {
    gameData.player1.score++;
    resetBall();
  }
  if (
    gameData.player1.score >= WINNING_SCORE ||
    gameData.player2.score >= WINNING_SCORE
  ) {
    setGameState("gameover");
  }
}
