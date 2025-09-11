// src/ui.ts

import {
  gameData,
  characters,
  p1UIPanel,
  p2UIPanel,
  p1CharImageContainer,
  p2CharImageContainer,
  p1CharImg,
  p2CharImg,
  p1StaminaFill,
  p2StaminaFill,
  p1CooldownGaugeContainer,
  p2CooldownGaugeContainer,
  canvas,
} from "./data";

export function resetBall() {
  gameData.ball.x = canvas.width / 2;
  gameData.ball.y = canvas.height / 2;
  gameData.ball.speedX = 0;
  gameData.ball.speedY = 0;
  gameData.ball.power = 1;
  gameData.ball.isInverted = false;
  gameData.gameState = "countingDown";
  gameData.countdown = 3;
}

export function applyCharacterStats() {
  const p1Char = characters[gameData.player1CharIndex];
  gameData.player1.height = p1Char.paddleHeight;
  gameData.player1.baseHeight = p1Char.paddleHeight;
  gameData.player1.baseSpeed = p1Char.paddleSpeed;
  gameData.player1.power = p1Char.power;
  gameData.player1.maxStamina = p1Char.maxStamina;
  gameData.player1.staminaRecoveryRate = p1Char.staminaRecoveryRate;
  gameData.player1.y = canvas.height / 2 - p1Char.paddleHeight / 2;
  gameData.player1.x = 0;
  gameData.player1.stamina = gameData.player1.maxStamina;
  gameData.player1.cooldownTimer = p1Char.cooldown;
  gameData.player1.isSuiciderActive = false;

  const p2Char = characters[gameData.player2CharIndex];
  gameData.player2.height = p2Char.paddleHeight;
  gameData.player2.baseHeight = p2Char.paddleHeight;
  gameData.player2.baseSpeed = p2Char.paddleSpeed;
  gameData.player2.power = p2Char.power;
  gameData.player2.maxStamina = p2Char.maxStamina;
  gameData.player2.staminaRecoveryRate = p2Char.staminaRecoveryRate;
  gameData.player2.y = canvas.height / 2 - p2Char.paddleHeight / 2;
  gameData.player2.x = canvas.width - gameData.player2.width;
  gameData.player2.stamina = gameData.player2.maxStamina;
  gameData.player2.cooldownTimer = p2Char.cooldown;
  gameData.player2.isSuiciderActive = false;
}

export function updateUI() {
  if (p1CooldownGaugeContainer) {
    const p1MaxCooldown = characters[gameData.player1CharIndex].cooldown;
    const p1CooldownProgress =
      p1MaxCooldown > 0 ? gameData.player1.cooldownTimer / p1MaxCooldown : 1;
    const p1CooldownAngle = p1CooldownProgress * 360;
    p1CooldownGaugeContainer.style.background = `conic-gradient(#f00 ${p1CooldownAngle}deg, rgba(255, 255, 255, 0.1) ${p1CooldownAngle}deg)`;

    if (gameData.player1.cooldownTimer >= p1MaxCooldown) {
      p1CooldownGaugeContainer.style.boxShadow = "0 0 10px 5px #f00";
    } else {
      p1CooldownGaugeContainer.style.boxShadow = "none";
    }
  }

  if (p2CooldownGaugeContainer) {
    const p2MaxCooldown = characters[gameData.player2CharIndex].cooldown;
    const p2CooldownProgress =
      p2MaxCooldown > 0 ? gameData.player2.cooldownTimer / p2MaxCooldown : 1;
    const p2CooldownAngle = p2CooldownProgress * 360;
    p2CooldownGaugeContainer.style.background = `conic-gradient(#f00 ${p2CooldownAngle}deg, rgba(255, 255, 255, 0.1) ${p2CooldownAngle}deg)`;

    if (gameData.player2.cooldownTimer >= p2MaxCooldown) {
      p2CooldownGaugeContainer.style.boxShadow = "0 0 10px 5px #f00";
    } else {
      p2CooldownGaugeContainer.style.boxShadow = "none";
    }
  }

  if (p1StaminaFill) {
    const p1StaminaPercentage =
      (gameData.player1.stamina / gameData.player1.maxStamina) * 100;
    p1StaminaFill.style.height = `${Math.max(0, p1StaminaPercentage)}%`;
  }

  if (p2StaminaFill) {
    const p2StaminaPercentage =
      (gameData.player2.stamina / gameData.player2.maxStamina) * 100;
    p2StaminaFill.style.height = `${Math.max(0, p2StaminaPercentage)}%`;
  }
}

export function toggleUIElements() {
  if (p1UIPanel)
    p1UIPanel.style.display =
      gameData.gameState === "game" ||
      gameData.gameState === "paused" ||
      gameData.gameState === "countingDown"
        ? "flex"
        : "none";
  if (p2UIPanel)
    p2UIPanel.style.display =
      gameData.gameState === "game" ||
      gameData.gameState === "paused" ||
      gameData.gameState === "countingDown"
        ? "flex"
        : "none";
  if (p1CharImageContainer)
    p1CharImageContainer.style.display =
      gameData.gameState === "characterSelect" ||
      gameData.gameState === "game" ||
      gameData.gameState === "paused" ||
      gameData.gameState === "countingDown"
        ? "block"
        : "none";
  if (p2CharImageContainer)
    p2CharImageContainer.style.display =
      gameData.gameState === "characterSelect" ||
      gameData.gameState === "game" ||
      gameData.gameState === "paused" ||
      gameData.gameState === "countingDown"
        ? "block"
        : "none";
}

export function updateCharacterImages() {
  if (p1CharImg) {
    p1CharImg.src = characters[gameData.player1CharIndex].imagePath;
  }
  if (p2CharImg) {
    p2CharImg.src = characters[gameData.player2CharIndex].imagePath;
  }
}

export const characterIcons = new Map<string, HTMLImageElement>();
export function preloadCharacterIcons() {
  characters.forEach((char) => {
    const winImg = new Image();
    winImg.src = char.winIconPath;
    characterIcons.set(char.winIconPath, winImg);

    const loseImg = new Image();
    loseImg.src = char.loseIconPath;
    characterIcons.set(char.loseIconPath, loseImg);
  });
}
