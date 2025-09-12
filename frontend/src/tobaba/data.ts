// src/data.ts

export type GameState =
  | "menu"
  | "characterSelect"
  | "game"
  | "paused"
  | "gameover"
  | "countingDown";

export const WINNING_SCORE = 10;
export const BALL_SIZE = 10;
export const COUNTDOWN_INTERVAL = 1000;
export const BASE_BALL_SPEED = 3;

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

/**
 * ページにDOMが描画された後に呼んで初期化する
 */
export function initDOMRefs() {
  canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  if (!canvas || !ctx) {
    throw new Error("Canvas element or 2D context not found");
  }

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
  p1CooldownGaugeContainer = document.getElementById(
    "p1-cooldown-gauge-container",
  ) as HTMLDivElement;
  p2CooldownGaugeContainer = document.getElementById(
    "p2-cooldown-gauge-container",
  ) as HTMLDivElement;
}

// ----------------- gameData とキャラ定義 -----------------

export const gameData = {
    gameState: "menu" as GameState,
    countdown: 3,
    player1CharIndex: 0,
    player2CharIndex: 0,
    player1Ready: false,
    player2Ready: false,
    ball: {
        x: 0,
        y: 0,
        size: BALL_SIZE,
        speedX: 0,
        speedY: 0,
        power: 1,
        isInverted: false
    },
    player1: {
        x: 0,
        y: 0,
        width: 10,
        height: 100,
        score: 0,
        cooldownTimer: 0, 
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
        maxAbilityUsages: 0 
    },
    player2: {
        x: 0,
        y: 0,
        width: 10,
        height: 100,
        score: 0,
        cooldownTimer: 0, 
        isAbilityActive: false,
        speedMultiplier: 1,
        baseSpeed: 5,
        baseHeight: 100,
        stamina: 100,
        maxStamina: 100,
        staminaRecoveryRate: 10,
        power: 1.1,
        isSuiciderActive: false,
        isPlayer1: false,
        isAI: false,
        abilityUsages: 0, 
        maxAbilityUsages: 0 
    },
    keysPressed: {} as { [key: string]: boolean }
};

export const characters = [
    {
        name: "Defaulko",
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
        ability: (player: any, charIndex: number) => { 
            console.log("Defaulko ability called - no effect");
        },
        cooldown: 0, 
        maxUsages: 0, 
        effectColor: "",
        imagePath: "@/../assets/defaulko/default.png",
        winIconPath: "@/../assets/defaulko/defaultWin.png",
        loseIconPath: "@/../assets/defaulko/defaultLose.png"
    },
    {
        name: "Gust",
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
            console.log("Gust ability called, usages:", player.abilityUsages, "max:", characters[charIndex].maxUsages);
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
        cooldown: 5,
        maxUsages: 3, 
        effectColor: "#0f0",
        imagePath: "@/../assets/gust/normal.png",
        winIconPath: "@/../assets/defaulko/defaultWin.png",
        loseIconPath: "@/../assets/defaulko/defaultLose.png",
    },
    {
        name: "M",
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
        abilityDescription: "For 5 seconds, the paddle will grow 1.5 times larger. (2 uses)",
        ability: (player: any, charIndex: number) => {
            console.log("M ability called, usages:", player.abilityUsages, "max:", characters[charIndex].maxUsages);
            if (player.abilityUsages < characters[charIndex].maxUsages) {
                console.log("M ability activated!");
                const originalHeight = player.height;
                player.isAbilityActive = true;
                player.height = originalHeight * 1.5;
                player.abilityUsages++;

                setTimeout(() => {
                    player.height = originalHeight;
                    player.isAbilityActive = false;
                    console.log("M ability ended");
                }, 5000);
            } else {
                console.log("M ability: no uses remaining");
            }
        },
        cooldown: 8,
        maxUsages: 2,
        effectColor: "#0f0",
        imagePath: "@/../assets/M/normal.png",
        winIconPath: "@/../assets/defaulko/defaultWin.png",
        loseIconPath: "@/../assets/defaulko/defaultLose.png",
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
        ability: (player: any, charIndex: number) => {
            console.log("Suicider ability called - switching position");
            player.isSuiciderActive = !player.isSuiciderActive;
            console.log("Suicider active:", player.isSuiciderActive);
        },
        cooldown: 0, 
        maxUsages: -1,
        effectColor: "#0f0",
        imagePath: "@/../assets/Suicider/normal.png",
        winIconPath: "@/../assets/defaulko/defaultWin.png",
        loseIconPath: "@/../assets/defaulko/defaultLose.png",
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
        abilityDescription: "Reverse the up and down movement of the ball. (4 uses)",
        ability: (player: any, charIndex: number) => {
            console.log("Sniper ability called, usages:", player.abilityUsages, "max:", characters[charIndex].maxUsages);
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
        cooldown: 8, 
        maxUsages: 10, 
        effectColor: "#0f0",
         imagePath: "@/../assets/Sniper/normal.png",
        winIconPath: "@/../assets/defaulko/defaultWin.png",
        loseIconPath: "@/../assets/defaulko/defaultLose.png",
    }
];
