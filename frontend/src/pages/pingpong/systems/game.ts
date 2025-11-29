// src/game.ts

import { gameData, canvas, characters, AI_LEVELS, stages } from "../core/data";
import { setGameState, resetBall } from "../core/state";
import {
  WINNING_SCORE,
  BASE_BALL_SPEED,
  CORE_HIT_RANGE,
  AI_TICK_RATE,
  FIXED_TIME_STEP,
} from "../core/constants";
import {
  createGoalEffect,
  createFastReturnEffect,
  createScreenShake,
  createShotEffect,
  createReturnEffect,
} from "./effects";
import { Ball } from "../core/Ball";

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  isPlayer1: boolean;
  stamina: number;
}

let lastAITick = 0;
let aiTargetY = gameData.player2.y;

function checkCollision(ball: Ball, player: Player) {
  const ballCenterX = ball.getCenterX();
  const ballCenterY = ball.getCenterY();
  const playerX = player.x;
  const playerY = player.y;
  const playerW = player.width;
  const playerH = player.height;

  const hit =
    ballCenterX + ball.size / 2 > playerX &&
    ballCenterX - ball.size / 2 < playerX + playerW &&
    ballCenterY + ball.size / 2 > playerY &&
    ballCenterY - ball.size / 2 < playerY + playerH;

  if (hit) {
    let collidePoint = ball.getCenterY() - (player.y + playerH / 2);
    collidePoint = collidePoint / (playerH / 2);
    const angleRad = (Math.PI / 4) * collidePoint;
    const direction = ball.x < canvas.width / 2 ? 1 : -1;

    const charIndex = player.isPlayer1
      ? gameData.player1CharIndex
      : gameData.player2CharIndex;
    const char = characters[charIndex];

    const currentStage = stages[gameData.selectedStageIndex];

    if (Math.abs(collidePoint) <= CORE_HIT_RANGE) {
      ball.power = char.power;
    } else {
      ball.power = 1;
    }

    const opponent = player.isPlayer1 ? gameData.player2 : gameData.player1;
    opponent.stamina = Math.max(0, opponent.stamina - ball.power * 5);

    const newSpeedX =
      BASE_BALL_SPEED *
      Math.cos(angleRad) *
      ball.power *
      currentStage.effects.bounceMultiplier;
    const newSpeedY =
      BASE_BALL_SPEED *
      Math.sin(angleRad) *
      ball.power *
      currentStage.effects.bounceMultiplier;

    ball.setSpeed(direction * newSpeedX, newSpeedY);

    const totalSpeed = Math.sqrt(newSpeedX * newSpeedX + newSpeedY * newSpeedY);
    if (totalSpeed > BASE_BALL_SPEED) {
      createFastReturnEffect(ballCenterX, ballCenterY, ball.power);
      createScreenShake(5, 200);
      console.log(
        `Fast return effect! Speed: ${totalSpeed}, Power: ${ball.power}`,
      );
    } else createReturnEffect(ballCenterX, ballCenterY);
  }
}

function handleWallCollision() {
  const currentStage = stages[gameData.selectedStageIndex];
  const ball = gameData.ball;

  if (
    ball.getCenterY() > canvas.height ||
    ball.getCenterY() < 0
  ) {
    if (currentStage.effects.warpWalls) {
      if (ball.getCenterY() < 0) {
        ball.y = canvas.height - ball.size / 2;
      } else {
        ball.y = ball.size / 2;
      }
    } else {
      ball.reverseSpeedY();
    }
  }
}

function handleAIAbility() {
  if (gameData.player2AILevel === "Player") {
    return;
  }

  const ball = gameData.ball;
  const aiChar = characters[gameData.player2CharIndex];
  const aiPlayer = gameData.player2;
  const distanceX = canvas.width - ball.x;

  switch (aiChar.name) {
    case "Gust":
      if (
        aiPlayer.abilityUsages < aiChar.maxUsages &&
        Math.abs(ball.x - aiPlayer.x) < 30 &&
        Math.abs(ball.y - aiPlayer.y) > 5 &&
        ball.speedX > 0
      ) {
        aiChar.ability(aiPlayer, gameData.player2CharIndex);
        console.log("AI Gust used ability!");
      }
      break;
    case "M":
      if (distanceX < 200 && aiPlayer.abilityUsages < aiChar.maxUsages) {
        aiChar.ability(aiPlayer, gameData.player2CharIndex);
        console.log("AI M used ability!");
      }
      break;
    case "Sniper":
      if (
        !gameData.player2.isSniperActive &&
        ball.speedX < 0 &&
        aiPlayer.abilityUsages < aiChar.maxUsages &&
        ball.x < 160 &&
        ball.x > 150 &&
        Math.abs(ball.speedY) > 0.7
      ) {
        createShotEffect(ball.x, ball.y);
        createScreenShake(8, 300);

        ball.reverseSpeedY();
        aiPlayer.abilityUsages++;
        console.log("AI Sniper used ability!");
        gameData.player2.isSniperActive = true;
      } else {
        if (ball.speedX > 0) {
          gameData.player2.isSniperActive = false;
        }
      }
      break;
    case "Suicider":
      if (!gameData.player2.isSuiciderActive) {
        if (
          ball.x > canvas.width / 2 - 50 &&
          ball.x < canvas.width / 2 &&
          Math.abs(ball.y - aiPlayer.y) < 50
        ) {
          gameData.player2.x = canvas.width / 2 - gameData.player2.width - 50;
          gameData.player2.isSuiciderActive = true;
          console.log("AI Suicider used ability!");
        }
      } else {
        if (ball.speedX < 0) {
          gameData.player2.x = canvas.width - gameData.player2.width;
          gameData.player2.isSuiciderActive = false;
          console.log("AI Suicider reverted!");
        }
      }
      break;
  }
}

export function update(deltaTime: number = FIXED_TIME_STEP) {
  const frameMultiplier = deltaTime / FIXED_TIME_STEP;
  const speedMultiplier2 = gameData.player2.stamina > 10 ? 1 : 0.5;
  const ball = gameData.ball;

  ball.update(frameMultiplier);

  handleWallCollision();

  if (ball.speedX < 0) checkCollision(ball, gameData.player1);
  else if (ball.speedX > 0)
    checkCollision(ball, gameData.player2);
  if (gameData.player2AILevel !== "Player") {
    const aiLevel =
      AI_LEVELS[gameData.player2AILevel as keyof typeof AI_LEVELS];
    const moveDirection = aiTargetY - gameData.player2.y;
    const distance = Math.abs(moveDirection);
    const maxSpeed =
      gameData.player2.baseSpeed *
      gameData.player2.speedMultiplier *
      speedMultiplier2 *
      aiLevel.trackingSpeed *
      frameMultiplier;
    const moveStep = Math.min(distance, maxSpeed);

    if (moveDirection > 0) {
      gameData.player2.y += moveStep;
    } else if (moveDirection < 0) {
      gameData.player2.y -= moveStep;
    }

    if (moveStep > 0) {
      gameData.player2.stamina = Math.max(
        0,
        gameData.player2.stamina - 1 * frameMultiplier,
      );
    }
  }

  handleAIAbility();
  if (ball.x - ball.size / 2 < 0) {
    gameData.player2.score++;
    createGoalEffect(50, canvas.height / 2);
    resetBall();
  } else if (ball.x + ball.size / 2 > canvas.width) {
    gameData.player1.score++;
    createGoalEffect(canvas.width - 50, canvas.height / 2);
    resetBall();
  }
  if (
    gameData.player1.score >= WINNING_SCORE ||
    gameData.player2.score >= WINNING_SCORE
  ) {
    setGameState("gameover");
  }
}

export function updateAI(gameTime: number) {
  if (gameData.player2AILevel === "Player") {
    return;
  }
  if (gameTime - lastAITick < AI_TICK_RATE) {
    return;
  }

  lastAITick = gameTime;

  const aiLevel = AI_LEVELS[gameData.player2AILevel as keyof typeof AI_LEVELS];
  const currentStage = stages[gameData.selectedStageIndex];

  let predictedY = gameData.ball.y;
  const distanceX = canvas.width - gameData.ball.x;
  const speedX = Math.abs(gameData.ball.speedX);

  if (speedX > 0) {
    const timeToReachPaddle = distanceX / speedX;
    let travelY = gameData.ball.speedY * timeToReachPaddle;
    predictedY += travelY;
    if (currentStage.effects.warpWalls) {
      while (predictedY < 0 || predictedY > canvas.height) {
        if (predictedY < 0) {
          predictedY = canvas.height + predictedY;
        } else if (predictedY > canvas.height) {
          predictedY = predictedY - canvas.height;
        }
      }
    } else {
      if (predictedY < 0 || predictedY > canvas.height) {
        let numBounces = Math.floor(Math.abs(predictedY) / canvas.height);
        if (numBounces % 2 !== 0) {
          predictedY = canvas.height - Math.abs(predictedY % canvas.height);
        } else {
          predictedY = Math.abs(predictedY % canvas.height);
        }
      }
    }
    const inaccuracy =
      (Math.random() - 0.5) * gameData.player2.height * aiLevel.accuracy;
    predictedY += inaccuracy;
  }

  aiTargetY = predictedY - gameData.player2.height / 2;
  aiTargetY = Math.max(
    0,
    Math.min(canvas.height - gameData.player2.height, aiTargetY),
  );
}
