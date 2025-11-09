// src/core/data.ts

import { BALL_SIZE } from "./constants";

export type GameState =
  | "menu"
  | "modeSelect"
  | "characterSelect"
  | "stageSelect"
  | "game"
  | "paused"
  | "gameover"
  | "countingDown";

export type GameMode = "local" | "online";

export let canvas: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;
export let p1StaminaFill: HTMLDivElement;
export let p2StaminaFill: HTMLDivElement;
export let p1CharImg: HTMLImageElement;
export let p2CharImg: HTMLImageElement;
export let p1CharImageContainer: HTMLDivElement;
export let p2CharImageContainer: HTMLDivElement;
export let p1UIPanel: HTMLDivElement;
export let p2UIPanel: HTMLDivElement;
export let p1CooldownGaugeContainer: HTMLDivElement;
export let p2CooldownGaugeContainer: HTMLDivElement;
export let p1UsingGaugeContainer: HTMLDivElement;
export let p2UsingGaugeContainer: HTMLDivElement;

/**
 * ページにDOMが描画された後に呼んで初期化する
 */
export function initDOMRefs() {
  canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  if (!canvas || !ctx) {
    throw new Error("Canvas element or 2D context not found");
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	ctx.putImageData(imageData, 0, 0);
  });

  p1StaminaFill = document.getElementById("p1-stamina-fill") as HTMLDivElement;
  p2StaminaFill = document.getElementById("p2-stamina-fill") as HTMLDivElement;
  p1CharImg = document.getElementById("p1-char-img") as HTMLImageElement;
  p2CharImg = document.getElementById("p2-char-img") as HTMLImageElement;
  p1CharImageContainer = document.getElementById(
    "p1-char-image",
  ) as HTMLDivElement;
  p2CharImageContainer = document.getElementById(
    "p2-char-image",
  ) as HTMLDivElement;
  p1UIPanel = document.querySelector(".left-panel") as HTMLDivElement;
  p2UIPanel = document.querySelector(".right-panel") as HTMLDivElement;
  p1UsingGaugeContainer = document.getElementById(
    "p1-using-gauge-container",
  ) as HTMLDivElement;
  p2UsingGaugeContainer = document.getElementById(
    "p2-using-gauge-container",
  ) as HTMLDivElement;

  console.log("DOM elements check:");
  console.log("p1UsingGaugeContainer:", p1UsingGaugeContainer);
  console.log("p2UsingGaugeContainer:", p2UsingGaugeContainer);
  console.log("p1StaminaFill:", p1StaminaFill);
  console.log("p2StaminaFill:", p2StaminaFill);

  if (!p1UsingGaugeContainer || !p2UsingGaugeContainer) {
    console.error("Using gauge containers not found!");
  }
}

// ----------------- gameData とキャラ定義 -----------------

export const gameData = {
  gameState: "menu" as GameState,
  previousGameState: "menu" as GameState,
  gameMode: "local" as GameMode,
  countdown: 3,
  player1CharIndex: 0,
  player2CharIndex: 0,
  selectedStageIndex: 0,
  player1Ready: false,
  player2Ready: false,
  player2AILevel: "Player",
  ball: {
    x: 0,
    y: 0,
    size: BALL_SIZE,
    speedX: 0,
    speedY: 0,
    power: 1,
  },
  player1: {
    x: 0,
    y: 0,
    width: 20,
    height: 100,
    score: 0,
    isAbilityActive: false,
    speedMultiplier: 1,
    baseSpeed: 5,
    baseHeight: 100,
    stamina: 100,
    maxStamina: 100,
    staminaRecoveryRate: 10,
    power: 1.1,
    isSuiciderActive: false,
    isPlayer1: true,
    isAI: false,
    abilityUsages: 0,
    maxAbilityUsages: 0,
  },
  player2: {
    x: 0,
    y: 0,
    width: 20,
    height: 100,
    score: 0,
    isAbilityActive: false,
    speedMultiplier: 1,
    baseSpeed: 5,
    baseHeight: 100,
    stamina: 100,
    maxStamina: 100,
    staminaRecoveryRate: 10,
    power: 1.1,
    isSuiciderActive: false,
    isSniperActive: false,
    isPlayer1: false,
    isAI: false,
    abilityUsages: 0,
    maxAbilityUsages: 0,
  },
  keysPressed: {} as { [key: string]: boolean },
};

export function setGameMode(mode: GameMode) {
  gameData.gameMode = mode;
}

export const stages = [
  {
    name: "Classic Court",
    description: "The standard Pong arena. Nothing fancy, just pure skill.",
    backgroundColor: "#000",
    ballColor: "#0ff",
    paddleColor: "#00f",
    effects: {
      ballSpeedMultiplier: 1.0,
      bounceMultiplier: 1.0,
      darkZone: false,
      warpWalls: false,
    },
    imagePath: "@/../assets/stages/classic.png",
  },
  {
    name: "Shadow Court",
    description:
      "The center zone is shrouded in darkness. Track the ball carefully!",
    backgroundColor: "#000",
    ballColor: "#525252ff",
    paddleColor: "#fff",
    effects: {
      ballSpeedMultiplier: 1.0,
      bounceMultiplier: 1.0,
      darkZone: true,
      warpWalls: false,
    },
    imagePath: "@/../assets/stages/shadow.png",
  },
  {
    name: "Trick Court",
    description:
      "Walls don't bounce - they teleport the ball to the opposite side!",
    backgroundColor: "#220044",
    ballColor: "#ff00ff",
    paddleColor: "#ff00ff",
    effects: {
      ballSpeedMultiplier: 1.0,
      bounceMultiplier: 1.0,
      darkZone: false,
      warpWalls: true,
    },
    imagePath: "@/../assets/stages/warp.png",
  },
];

export const characters = [
  {
    name: "Snowman",
    description: "It's a balanced standard ability.",
    paddleHeight: 100,
    paddleSpeed: 5,
    power: 1.1,
    maxStamina: 100,
    staminaRecoveryRate: 15,
    speedRank: 3,
    powerRank: 3,
    staminaRank: 3,
    sizeRank: 3,
    abilityName: "none",
    abilityDescription: "There are no special abilities.",
    ability: () => {
      console.log("Defaulko ability called - no effect");
    },
    maxUsages: 0,
    effectColor: "",
    imagePath: "/characters/Snowman/default.png",
    winIconPath: "/characters/Snowman/win.png",
    loseIconPath: "/characters/Snowman/lose.png",
  },
  {
    name: "Robot",
    description: "Paddle movement is fast.",
    paddleHeight: 100,
    paddleSpeed: 7,
    power: 1.05,
    maxStamina: 80,
    staminaRecoveryRate: 20,
    speedRank: 5,
    powerRank: 2,
    staminaRank: 1,
    sizeRank: 3,
    abilityName: "Lisbon Wind",
    abilityDescription: "Paddle speed doubles for 3 seconds. (3 uses)",
    ability: (player: any, charIndex: number) => {
      console.log(
        "Gust ability called, usages:",
        player.abilityUsages,
        "max:",
        characters[charIndex].maxUsages,
      );
      if (player.abilityUsages < characters[charIndex].maxUsages) {
        console.log("Gust ability activated!");
        player.isAbilityActive = true;
        player.speedMultiplier = 2;
        player.abilityUsages++;

        setTimeout(() => {
          player.speedMultiplier = 1;
          player.isAbilityActive = false;
          console.log("Gust ability ended");
        }, 3000);
      } else {
        console.log("Gust ability: no uses remaining");
      }
    },
    maxUsages: 3,
    effectColor: "#0f0",
    imagePath: "/characters/Robot/default.png",
    winIconPath: "/characters/Robot/win.png",
    loseIconPath: "/characters/Robot/lose.png",
  },
  {
    name: "Queen",
    description: "His paddle is big.",
    paddleHeight: 150,
    paddleSpeed: 4,
    power: 1.2,
    maxStamina: 120,
    staminaRecoveryRate: 10,
    speedRank: 1,
    powerRank: 5,
    staminaRank: 5,
    sizeRank: 5,
    abilityName: "M★E★G★A",
    abilityDescription:
      "For 20 seconds, the paddle will grow 2.5 times larger. (1 uses)",
    ability: (player: any, charIndex: number) => {
      console.log(
        "M ability called, usages:",
        player.abilityUsages,
        "max:",
        characters[charIndex].maxUsages,
      );
      if (player.abilityUsages < characters[charIndex].maxUsages) {
        console.log("M ability activated!");
        const originalHeight = player.height;
        player.isAbilityActive = true;
        player.height = originalHeight * 2.5;
        player.abilityUsages++;

        setTimeout(() => {
          player.height = originalHeight;
          player.isAbilityActive = false;
          console.log("M ability ended");
        }, 20000);
      } else {
        console.log("M ability: no uses remaining");
      }
    },
    maxUsages: 1,
    effectColor: "#0f0",
    imagePath: "/characters/Queen/default.png",
    winIconPath: "/characters/Queen/win.png",
    loseIconPath: "/characters/Queen/lose.png",
  },
  {
    name: "Suicider",
    description: "Launch a quick front-court attack.",
    paddleHeight: 100,
    paddleSpeed: 5,
    power: 1.1,
    maxStamina: 90,
    staminaRecoveryRate: 12,
    speedRank: 4,
    powerRank: 5,
    staminaRank: 2,
    sizeRank: 3,
    abilityName: "Sacrifice",
    abilityDescription: "Switch the paddle back and forth. (Unlimited)",
    ability: (player: any) => {
      console.log("Suicider ability called - switching position");
      player.isSuiciderActive = !player.isSuiciderActive;
      console.log("Suicider active:", player.isSuiciderActive);
    },
    maxUsages: -1,
    effectColor: "#0f0",
    imagePath: "/characters/Suicider/default.png",
    winIconPath: "/characters/Suicider/win.png",
    loseIconPath: "/characters/Suicider/lose.png",
  },
  {
    name: "Sniper",
    description: "Don't miss any Pong.",
    paddleHeight: 100,
    paddleSpeed: 5,
    power: 1.25,
    maxStamina: 100,
    staminaRecoveryRate: 15,
    speedRank: 3,
    powerRank: 4,
    staminaRank: 3,
    sizeRank: 3,
    abilityName: "Shot",
    abilityDescription:
      "Reverse the up and down movement of the ball. (10 uses)",
    ability: (player: any, charIndex: number) => {
      console.log(
        "Sniper ability called, usages:",
        player.abilityUsages,
        "max:",
        characters[charIndex].maxUsages,
      );
      if (player.abilityUsages < characters[charIndex].maxUsages) {
        console.log("Sniper ability activated!");
        player.isAbilityActive = true;
        player.abilityUsages++;

        setTimeout(() => {
          player.isAbilityActive = false;
          console.log("Sniper ability ended");
        }, 1000);
      } else {
        console.log("Sniper ability: no uses remaining");
      }
    },
    maxUsages: 10,
    effectColor: "#0f0",
    imagePath: "/characters/Sniper/default.png",
    winIconPath: "/characters/Sniper/win.png",
    loseIconPath: "/characters/Sniper/lose.png",
  },
];

export const AI_LEVELS = {
  "AI: easy": {
    trackingSpeed: 1,
    accuracy: 0,
  },
  "AI: normal": {
    trackingSpeed: 1,
    accuracy: 0.7,
  },
  "AI: hard": {
    trackingSpeed: 1,
    accuracy: 1,
  },
};
