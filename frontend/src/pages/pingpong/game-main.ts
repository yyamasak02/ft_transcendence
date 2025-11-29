// src/game-main.ts

import {
  initDOMRefs,
  gameData,
  canvas,
  ctx,
  characters,
  stages,
  setGameMode,
} from "./core/data";
import { update, updateAI } from "./systems/game";
import { updateAbilities, activateAbility } from "./systems/abilities";
import {
  updateEffects,
  renderEffects,
  applyScreenShake,
  createFireworkEffect,
} from "./systems/effects";
import {
  drawRect,
  drawBall,
  drawScore,
  drawMenu,
  drawGameOver,
  drawPauseMenu,
  drawCountdown,
  drawCharacterSelect,
  drawModeSelect,
  drawStageSelect,
} from "./ui/draw";
import {
  toggleUIElements,
  updateCharacterImages,
  applyCharacterStats,
  updateUI,
  preloadCharacterIcons,
} from "./ui/ui";
import {
  setPlayer1CharIndex,
  setPlayer2CharIndex,
  setPlayer1Ready,
  setPlayer2Ready,
  handleCharacterSelection,
  setPlayer2AILevel,
  setSelectedStage,
  handleStageSelection,
  setGameState,
} from "./core/state";
import {
  FIXED_TIME_STEP,
  MAX_DELTA_TIME,
  BASE_BALL_SPEED,
  WINNING_SCORE,
  COUNTDOWN_INTERVAL,
  FIREWORK_INTERVAL,
  setBallSpeed,
  setWinningScore,
} from "./core/constants";

let lastTime = 0;
let countdownTimer = 0;
let accumulator = 0;
let gameTime = 0;
let lastFireworkTime = 0;

function updateGameLogic(deltaTime: number) {
  gameTime += deltaTime;

  if (gameData.gameState === "game") {
    updateAbilities(gameTime);
    updateEffects(gameTime);
    handlePlayerMovement(deltaTime);
    updateAI(gameTime);
    update(deltaTime);
    gameData.player1.stamina = Math.min(
      gameData.player1.maxStamina,
      gameData.player1.stamina +
        gameData.player1.staminaRecoveryRate * (deltaTime / 1000),
    );
    gameData.player2.stamina = Math.min(
      gameData.player2.maxStamina,
      gameData.player2.stamina +
        gameData.player2.staminaRecoveryRate * (deltaTime / 1000),
    );
  }
  if (gameData.gameState === "countingDown") {
    updateAbilities(gameTime);
    updateEffects(gameTime);
    handlePlayerMovement(deltaTime);
    gameData.player1.stamina = Math.min(
      gameData.player1.maxStamina,
      gameData.player1.stamina +
        gameData.player1.staminaRecoveryRate * (deltaTime / 1000),
    );
    gameData.player2.stamina = Math.min(
      gameData.player2.maxStamina,
      gameData.player2.stamina +
        gameData.player2.staminaRecoveryRate * (deltaTime / 1000),
    );
    countdownTimer += deltaTime;
    if (countdownTimer >= COUNTDOWN_INTERVAL) {
      gameData.countdown--;
      countdownTimer = 0;
      if (gameData.countdown <= 0) {
        const currentStage = stages[gameData.selectedStageIndex];
        const adjustedBallSpeed =
          BASE_BALL_SPEED * currentStage.effects.ballSpeedMultiplier;
        const startDirection =
          gameData.player1.score > gameData.player2.score ? -1 : 1;
        gameData.ball.setSpeed(adjustedBallSpeed * startDirection, 0);
        setGameState("game");
      }
    }
  }
  if (gameData.gameState === "gameover") {
    updateEffects(gameTime);

    if (gameTime - lastFireworkTime >= FIREWORK_INTERVAL) {
      lastFireworkTime = gameTime;

      const winner = gameData.player1.score > gameData.player2.score ? 1 : 2;
      const xPosition =
        winner === 1
          ? canvas.width / 4 + (Math.random() - 0.5) * 100
          : (canvas.width * 3) / 4 + (Math.random() - 0.5) * 100;
      const yPosition = 100 + Math.random() * 200;

      createFireworkEffect(xPosition, yPosition);
    }
  }
}

function handlePlayerMovement(deltaTime: number) {
  const frameMultiplier = deltaTime / FIXED_TIME_STEP;

  if (gameData.gameState === "game" || gameData.gameState === "countingDown") {
    const speedMultiplier1 = gameData.player1.stamina > 10 ? 1 : 0.5;
    const speedMultiplier2 = gameData.player2.stamina > 10 ? 1 : 0.5;

    if (gameData.keysPressed["w"] && gameData.player1.y > 0) {
      const moveDistance =
        gameData.player1.baseSpeed *
        gameData.player1.speedMultiplier *
        speedMultiplier1 *
        frameMultiplier;
      gameData.player1.y -= moveDistance;
      gameData.player1.stamina = Math.max(
        0,
        gameData.player1.stamina - 1 * frameMultiplier,
      );
    }
    if (
      gameData.keysPressed["s"] &&
      gameData.player1.y < canvas.height - gameData.player1.height
    ) {
      const moveDistance =
        gameData.player1.baseSpeed *
        gameData.player1.speedMultiplier *
        speedMultiplier1 *
        frameMultiplier;
      gameData.player1.y += moveDistance;
      gameData.player1.stamina = Math.max(
        0,
        gameData.player1.stamina - 1 * frameMultiplier,
      );
    }

    if (gameData.player2AILevel === "Player") {
      if (gameData.keysPressed["ArrowUp"] && gameData.player2.y > 0) {
        const moveDistance =
          gameData.player2.baseSpeed *
          gameData.player2.speedMultiplier *
          speedMultiplier2 *
          frameMultiplier;
        gameData.player2.y -= moveDistance;
        gameData.player2.stamina = Math.max(
          0,
          gameData.player2.stamina - 1 * frameMultiplier,
        );
      }
      if (
        gameData.keysPressed["ArrowDown"] &&
        gameData.player2.y < canvas.height - gameData.player2.height
      ) {
        const moveDistance =
          gameData.player2.baseSpeed *
          gameData.player2.speedMultiplier *
          speedMultiplier2 *
          frameMultiplier;
        gameData.player2.y += moveDistance;
        gameData.player2.stamina = Math.max(
          0,
          gameData.player2.stamina - 1 * frameMultiplier,
        );
      }
    }
  }
}

document.addEventListener("keydown", (e) => {
  gameData.keysPressed[e.key] = true;

  if (gameData.gameState === "paused") {
    switch (e.key.toLowerCase()) {
      case "q":
        setBallSpeed(BASE_BALL_SPEED + 1);
        return;
      case "a":
        setBallSpeed(BASE_BALL_SPEED - 1);
        return;
      case "w":
        setWinningScore(WINNING_SCORE + 1);
        return;
      case "s":
        setWinningScore(WINNING_SCORE - 1);
        return;
    }
  }

  if (e.key.toLowerCase() === "p") {
    if (gameData.gameState === "game") {
      setGameState("paused");
    } else if (gameData.gameState === "characterSelect") {
      setGameState("paused");
    } else if (gameData.gameState === "paused") {
      if (gameData.previousGameState === "characterSelect") {
        setGameState("characterSelect");
      } else {
        setGameState("game");
      }
    }
    toggleUIElements();
    return;
  }

  if (gameData.gameState === "modeSelect") {
    switch (e.key) {
      case "w":
      case "ArrowUp":
        setGameMode("local");
        break;
      case "s":
      case "ArrowDown":
        setGameMode("online");
        break;
    }

    if (e.key === "Enter") {
      if (gameData.gameMode === "local") {
        setGameState("characterSelect");
        toggleUIElements();
        updateCharacterImages();
      } else {
        console.log("Online mode coming soon!");
        setGameMode("local");
        setGameState("menu");
        toggleUIElements();
        updateCharacterImages();
      }
    }
    return;
  } else if (gameData.gameState === "characterSelect") {
    switch (e.key) {
      case "w":
        if (!gameData.player1Ready) {
          setPlayer1CharIndex(
            gameData.player1CharIndex > 0
              ? gameData.player1CharIndex - 1
              : characters.length - 1,
          );
        }
        break;
      case "s":
        if (!gameData.player1Ready) {
          setPlayer1CharIndex(
            gameData.player1CharIndex < characters.length - 1
              ? gameData.player1CharIndex + 1
              : 0,
          );
        }
        break;
      case "ArrowUp":
        if (!gameData.player2Ready) {
          setPlayer2CharIndex(
            gameData.player2CharIndex > 0
              ? gameData.player2CharIndex - 1
              : characters.length - 1,
          );
        }
        break;
      case "ArrowDown":
        if (!gameData.player2Ready) {
          setPlayer2CharIndex(
            gameData.player2CharIndex < characters.length - 1
              ? gameData.player2CharIndex + 1
              : 0,
          );
        }
        break;
      case "d":
        if (!gameData.player1Ready) {
          setPlayer1Ready(true);
        } else setPlayer1Ready(false);
        break;
      case "Enter":
        if (!gameData.player2Ready) {
          setPlayer2Ready(true);
        } else setPlayer2Ready(false);
        break;
      case "ArrowLeft":
        if (!gameData.player2Ready) {
          if (gameData.player2AILevel === "Player") {
            setPlayer2AILevel("AI: hard");
          } else if (gameData.player2AILevel === "AI: hard") {
            setPlayer2AILevel("AI: normal");
          } else if (gameData.player2AILevel === "AI: normal") {
            setPlayer2AILevel("AI: easy");
          } else {
            setPlayer2AILevel("Player");
          }
        }
        break;
      case "ArrowRight":
        if (!gameData.player2Ready) {
          if (gameData.player2AILevel === "Player") {
            setPlayer2AILevel("AI: easy");
          } else if (gameData.player2AILevel === "AI: easy") {
            setPlayer2AILevel("AI: normal");
          } else if (gameData.player2AILevel === "AI: normal") {
            setPlayer2AILevel("AI: hard");
          } else {
            setPlayer2AILevel("Player");
          }
        }
        break;
    }
    handleCharacterSelection();
    return;
  } else if (gameData.gameState === "stageSelect") {
    switch (e.key) {
      case "a":
      case "ArrowLeft":
        if (gameData.selectedStageIndex > 0) {
          setSelectedStage(gameData.selectedStageIndex - 1);
        }
        break;
      case "d":
      case "ArrowRight":
        if (gameData.selectedStageIndex < stages.length - 1) {
          setSelectedStage(gameData.selectedStageIndex + 1);
        }
        break;
    }

    if (e.key === "Enter") {
      handleStageSelection();
    }
    return;
  } else if (gameData.gameState === "game") {
    if (e.key.toLowerCase() === "f") {
      const char = characters[gameData.player1CharIndex];
      let abilityType = "";

      switch (char.name) {
        case "Gust":
          abilityType = "gust";
          break;
        case "M":
          abilityType = "mega";
          break;
        case "Suicider":
          abilityType = "suicider";
          break;
        case "Sniper":
          abilityType = "shot";
          break;
      }

      if (abilityType) {
        activateAbility(1, gameData.player1CharIndex, abilityType);
      }
    }

    if (e.key.toLowerCase() === "j") {
      const char = characters[gameData.player2CharIndex];
      let abilityType = "";

      switch (char.name) {
        case "Gust":
          abilityType = "gust";
          break;
        case "M":
          abilityType = "mega";
          break;
        case "Suicider":
          abilityType = "suicider";
          break;
        case "Sniper":
          abilityType = "shot";
          break;
      }

      if (abilityType) {
        activateAbility(2, gameData.player2CharIndex, abilityType);
      }
    }
  }
  if (e.key === "Enter") {
    if (gameData.gameState === "menu") {
      setGameState("modeSelect");
    } else if (gameData.gameState === "gameover") {
      setGameState("menu");
      gameData.player1.score = 0;
      gameData.player2.score = 0;
      applyCharacterStats();
      toggleUIElements();
    } else if (gameData.gameState === "paused") {
      setGameState("menu");
      gameData.player1.score = 0;
      gameData.player2.score = 0;
      applyCharacterStats();
      toggleUIElements();
    }
  }
});

document.addEventListener("keyup", (e) => {
  gameData.keysPressed[e.key] = false;
});

function gameLoop(currentTime: number) {
  const deltaTime =
    lastTime === 0 ? 0 : Math.min(currentTime - lastTime, MAX_DELTA_TIME);
  lastTime = currentTime;
  accumulator += deltaTime;

  while (accumulator >= FIXED_TIME_STEP) {
    updateGameLogic(FIXED_TIME_STEP);
    accumulator -= FIXED_TIME_STEP;
  }
  render();

  requestAnimationFrame(gameLoop);
}

function render() {
  const shake = applyScreenShake();
  ctx.save();
  ctx.translate(shake.x, shake.y);

  if (gameData.gameState === "game" || gameData.gameState === "countingDown") {
    const currentStage = stages[gameData.selectedStageIndex];
    ctx.fillStyle = currentStage.backgroundColor;
    ctx.fillRect(-shake.x, -shake.y, canvas.width, canvas.height);
  } else {
    ctx.clearRect(-shake.x, -shake.y, canvas.width, canvas.height);
  }

  toggleUIElements();

  if (gameData.gameState === "game" || gameData.gameState === "countingDown") {
    updateUI();

    let p1EffectColor = characters[gameData.player1CharIndex].effectColor;
    let p2EffectColor = characters[gameData.player2CharIndex].effectColor;
    let p1IsGlowing = gameData.player1.isAbilityActive;
    let p2IsGlowing = gameData.player2.isAbilityActive;

    const currentStage = stages[gameData.selectedStageIndex];

    if (gameData.player1.isSuiciderActive) {
      gameData.player1.x = canvas.width / 2 - gameData.player1.width - 50;
    } else {
      gameData.player1.x = 0;
    }

    if (!gameData.player2.isAI) {
      if (gameData.player2.isSuiciderActive) {
        gameData.player2.x = canvas.width / 2 + 50;
      } else {
        gameData.player2.x = canvas.width - gameData.player2.width;
      }
    }

    drawRect(
      gameData.player1.x,
      gameData.player1.y,
      gameData.player1.width,
      gameData.player1.height,
      currentStage.paddleColor,
      p1IsGlowing,
      p1EffectColor,
      gameData.player1.stamina <= 10,
    );
    drawRect(
      gameData.player2.x,
      gameData.player2.y,
      gameData.player2.width,
      gameData.player2.height,
      currentStage.paddleColor,
      p2IsGlowing,
      p2EffectColor,
      gameData.player2.stamina <= 10,
    );

    drawScore();
    drawBall(
      gameData.ball.x,
      gameData.ball.y,
      gameData.ball.size,
      currentStage.ballColor,
      gameData.ball.power,
    );

    renderEffects();

    if (gameData.gameState === "countingDown") {
      drawCountdown();
    }
  } else if (gameData.gameState === "menu") {
    drawMenu();
  } else if (gameData.gameState === "modeSelect") {
    drawModeSelect();
  } else if (gameData.gameState === "characterSelect") {
    drawCharacterSelect();
  } else if (gameData.gameState === "stageSelect") {
    drawStageSelect();
  } else if (gameData.gameState === "gameover") {
    drawGameOver();
    renderEffects();
  } else if (gameData.gameState === "paused") {
    drawPauseMenu();
  }

  ctx.restore();
}

export function startPingPongGame() {
  initDOMRefs();
  preloadCharacterIcons();
  updateCharacterImages();
  // 初期状態でUIを非表示に
  toggleUIElements();
  requestAnimationFrame(gameLoop);
}
