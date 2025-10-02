// src/ui/ui.ts

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
  p1UsingGaugeContainer,
  p2UsingGaugeContainer,
  canvas,
} from "../core/data";

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
  gameData.player1.isSuiciderActive = false;
  gameData.player1.abilityUsages = 0;
  gameData.player1.maxAbilityUsages = p1Char.maxUsages;

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
  gameData.player2.isSuiciderActive = false;
  gameData.player2.isSniperActive = false;
  gameData.player2.abilityUsages = 0;
  gameData.player2.maxAbilityUsages = p2Char.maxUsages;
}

function renderUsageBars(container: HTMLElement, char: any, player: any) {
  container.innerHTML = "";
  const bars = document.createElement("div");
  bars.className = "usage-bars";

  if (char.maxUsages === 0) {
    const bar = document.createElement("div");
    bar.className = "usage-bar none";
    bar.textContent = "NONE";
    bars.appendChild(bar);
  } else if (char.maxUsages === -1) {
    const bar = document.createElement("div");
    bar.className = "usage-bar infinite";
    bar.textContent = "∞ INF";
    bars.appendChild(bar);
  } else {
    for (let i = 0; i < char.maxUsages - player.abilityUsages; i++) {
      const bar = document.createElement("div");
      bar.className = "usage-bar active";
      bars.appendChild(bar);
    }
    for (let i = 0; i < player.abilityUsages; i++) {
      const bar = document.createElement("div");
      bar.className = "usage-bar inactive";
      bars.appendChild(bar);
    }
  }
  container.appendChild(bars);
}

function renderStaminaBars() {
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

export function updateUI() {
  if (p1UsingGaugeContainer) {
    renderUsageBars(
      p1UsingGaugeContainer,
      characters[gameData.player1CharIndex],
      gameData.player1,
    );
  }
  if (p2UsingGaugeContainer) {
    renderUsageBars(
      p2UsingGaugeContainer,
      characters[gameData.player2CharIndex],
      gameData.player2,
    );
  }
  renderStaminaBars();
}

export function toggleUIElements() {
  // 体力バー: ゲーム中のみ表示
  const shouldShowUI =
    gameData.gameState === "game" ||
    gameData.gameState === "paused" ||
    gameData.gameState === "countingDown";

  // キャラクター画像: キャラクター選択画面以降で表示
  const shouldShowCharImages =
    gameData.gameState === "characterSelect" ||
    gameData.gameState === "stageSelect" ||
    gameData.gameState === "game" ||
    gameData.gameState === "paused" ||
    gameData.gameState === "countingDown";

  console.log("toggleUIElements called:", {
    gameState: gameData.gameState,
    shouldShowUI,
    shouldShowCharImages,
  });

  if (p1UIPanel) {
    if (shouldShowUI) {
      p1UIPanel.classList.remove("hidden");
      p1UIPanel.classList.add("flex");
    } else {
      p1UIPanel.classList.add("hidden");
      p1UIPanel.classList.remove("flex");
    }
  }
  if (p2UIPanel) {
    if (shouldShowUI) {
      p2UIPanel.classList.remove("hidden");
      p2UIPanel.classList.add("flex");
    } else {
      p2UIPanel.classList.add("hidden");
      p2UIPanel.classList.remove("flex");
    }
  }
  if (p1CharImageContainer) {
    if (shouldShowCharImages) {
      p1CharImageContainer.classList.remove("hidden");
      p1CharImageContainer.classList.add("flex");
    } else {
      p1CharImageContainer.classList.add("hidden");
      p1CharImageContainer.classList.remove("flex");
    }
  }
  if (p2CharImageContainer) {
    if (shouldShowCharImages) {
      p2CharImageContainer.classList.remove("hidden");
      p2CharImageContainer.classList.add("flex");
    } else {
      p2CharImageContainer.classList.add("hidden");
      p2CharImageContainer.classList.remove("flex");
    }
  }
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
