// src/game-main.ts ゲーム本体

import { Vector3, Color4 } from "@babylonjs/core";
import { initDOMRefs, canvas, engine, scene } from "./core/data";
import { loadSettings } from "./core/gameSettings";
import { Ball } from "./object/Ball";
import { Paddle, createPaddles } from "./object/Paddle";
import type { PaddleInput } from "./object/Paddle";
import { Stage } from "./object/Stage";
import {
  checkPaddleCollision,
  countdownAndServe,
} from "./object/ballPaddleUtils";
import {
  setupKeyboardListener,
  cleanupKeyboardListener,
  getPaddleInputs,
  isEnterPressed,
} from "./input/keyboard";
import { GameHUD } from "./object/ui3D/GameHUD";
import { navigate } from "@/router/router";
import type { GameState } from "./core/game";
import { createWinEffect, disposeWinEffect } from "./object/effect/finEffect";
import {
  cutIn,
  zoomOut,
  stopZoomOut,
  transitionToPlayView,
} from "./object/effect/cameraWork";
import { AIController } from "./object/AI/AI";

let settings = loadSettings();
let isRunning = false;
let isPaused = false;

let ball: Ball | null = null;
let paddle1: Paddle | null = null;
let paddle2: Paddle | null = null;
let stage: Stage | null = null;
let hud: GameHUD | null = null;
let aiController: AIController | null = null;
let p1Score = 0;
let p2Score = 0;
let p2Input: PaddleInput = { up: false, down: false };

export const gameState: GameState = {
  phase: "menu",
  rallyActive: true,
  isServing: false,
  lastWinner: null,
  resetLocked: false,
  countdownID: 0,
};

export function reloadSettings() {
  settings = loadSettings();
}

// ============================================
// ゲーム本体
// ============================================

export function startGame() {
  if (isRunning) {
    console.log("startGame called but game is already running");
    return;
  }

  // ===== 各種初期化 ========================

  gameState.resetLocked = false;

  reloadSettings();
  isRunning = true;
  isPaused = false;

  if (settings.player2Type !== "Player") {
    aiController = new AIController(settings.player2Type);
  } else {
    aiController = null;
  }
  initDOMRefs();

  hud = new GameHUD(scene);
  setupKeyboardListener();

  gameState.phase = "menu";
  gameState.rallyActive = false;
  gameState.isServing = false;
  gameState.lastWinner = null;
  gameState.countdownID = 0;
  gameState.resetLocked = false;

  p1Score = 0;
  p2Score = 0;

  updateUIButtons();

  scene.clearColor = new Color4(0, 0, 0, 0.5); // 背景色

  // paddle作成
  const { p1, p2 } = createPaddles(scene, settings);
  paddle1 = p1;
  paddle2 = p2;

  // ball作成
  const initialBallPos = new Vector3(0, 1, 0);
  ball = new Ball(scene, initialBallPos, settings.ballSpeed);
  ball.stop();
  ball.velocity = new Vector3(0, 0, 0);
  ball.reset("center", paddle1, paddle2);

  // stage作成
  stage = new Stage(scene, canvas, paddle1, paddle2, ball, settings);

  if (stage.camera) {
    stage.camera.alpha = -Math.PI / 4;
    stage.camera.beta = Math.PI / 3;
    stage.camera.radius = 450;
  }

  hud.setScore(p1Score, p2Score);
  hud.hideScore();
  hud.showTitle();
  hud.startFloatingTextAnimation(scene);

  // ===== 描画ループ開始 ========================

  engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();

    if (paddle1 && paddle2 && ball) {
      if (gameState.phase === "menu") {
        if (isEnterPressed()) {
          handleEnterToStart();
        }
      } else if (gameState.phase === "game" && !isPaused) {
        // paddleの動き
        const allInputs = getPaddleInputs();
        paddle1.update(deltaTime, allInputs.p1);
        if (aiController) {
          p2Input = aiController.getInputs(ball, paddle2);
        } else {
          p2Input = allInputs.p2;
        }
        paddle2.update(deltaTime, p2Input);
        // ラリー &　スコア
        const result = ball.update(
          deltaTime,
          paddle1,
          paddle2,
          gameState,
          checkPaddleCollision,
        );
        if (result && hud)
          onScore(result.scorer, ball, paddle1, paddle2, hud, gameState);
      }
    }
    scene.render();
  });
}

async function handleEnterToStart() {
  if (!hud || !stage || !stage.camera || !ball || !paddle1 || !paddle2) return;

  hud.clearTitle();
  hud.stopFloatingTextAnimation(scene);

  await transitionToPlayView(stage.camera, 1500);
  hud.showScore();
  gameState.phase = "game";

  countdownAndServe(
    "center",
    ball,
    paddle1,
    paddle2,
    gameState,
    hud,
    settings,
    UILockController,
  );
}

// ============================================
// 内部実装部
// ============================================

// スコア更新
export function onScore(
  scorer: 1 | 2,
  ball: Ball,
  paddle1: Paddle,
  paddle2: Paddle,
  hud: GameHUD,
  gameState: GameState,
) {
  reloadSettings();
  const winningScore = settings.winningScore;

  if (scorer === 1) {
    p1Score++;
    gameState.lastWinner = 1;
  } else {
    p2Score++;
    gameState.lastWinner = 2;
  }
  hud.setScore(p1Score, p2Score);

  if (p1Score >= winningScore) {
    endGame(hud, 1);
    return;
  }
  if (p2Score >= winningScore) {
    endGame(hud, 2);
    return;
  }

  countdownAndServe(
    gameState.lastWinner,
    ball,
    paddle1,
    paddle2,
    gameState,
    hud,
    settings,
    UILockController,
  );
}

// ゲーム終了
export function endGame(hud: GameHUD, winner: 1 | 2) {
  console.log("Game Over");

  gameState.countdownID++;
  gameState.phase = "gameover";
  gameState.isServing = false;
  gameState.rallyActive = false;
  UILockController.lock();

  isRunning = false;
  isPaused = false;

  hud.clearCountdown();

  //   hud.showGameOver(winner === 1 ? "Player1" : "Player2");
  if (ball) ball.stop();

  endGameDirection(winner);
  hud.hideScore();
  setTimeout(() => {
    if (hud) {
      hud.showFinalResult(
        winner === 1 ? "Player1" : "Player2",
        p1Score,
        p2Score,
      );
    }
  }, 5000);
  setTimeout(cleanupAndGoHome, 15000);
}

async function endGameDirection(winner: 1 | 2) {
  if (!scene || !stage || !stage.camera || !ball) {
    return;
  }

  const TARGET_RADIUS = 150;
  const ZOOM_OUT_DURATION_MS = 10000;
  createWinEffect(scene, winner);
  await cutIn(stage.camera, ball.mesh.position);
  stopZoomOut();
  zoomOut(stage.camera, TARGET_RADIUS, ZOOM_OUT_DURATION_MS);
}

// 後始末用関数
function cleanupAndGoHome() {
  stopZoomOut();
  disposeWinEffect();
  cleanupKeyboardListener();

  if (hud) {
    if (hud.plane && !hud.plane.isDisposed) hud.plane.dispose();
  }
  hud = null;

  if (scene && !scene.isDisposed) scene.dispose();
  if (engine) {
    engine.stopRenderLoop();
    engine.dispose();
  }

  navigate("/");
}

//　ゲーム強制終了
export function stopGame() {
  console.log("stopGame called");
  if (!isRunning) return;

  isRunning = false;
  isPaused = false;

  gameState.phase = "menu";
  gameState.rallyActive = true;
  gameState.isServing = false;
  gameState.lastWinner = null;

  p1Score = 0;
  p2Score = 0;

  // keyboardListenerの解除
  cleanupKeyboardListener();
  stopZoomOut();
  disposeWinEffect();

  // hudの破棄
  if (hud) {
    if (hud.plane && !hud.plane.isDisposed) hud.plane.dispose();
    hud = null;
  }
  if (ball) {
    ball.stop();
    ball = null;
  }
  paddle1 = null;
  paddle2 = null;
  // scene, engineの破棄
  if (scene && !scene.isDisposed) scene.dispose();
  if (engine) {
    engine.stopRenderLoop();
    engine.dispose();
  }
}

// ゲームリセット
export function resetGame() {
  console.log("resetGame called");

  if (!isRunning || !scene || scene.isDisposed || gameState.resetLocked) return;

  gameState.countdownID++;

  reloadSettings();
  isPaused = false;
  gameState.phase = "game";
  gameState.rallyActive = false;
  gameState.isServing = false;
  gameState.lastWinner = null;
  p1Score = 0;
  p2Score = 0;

  // スコアを戻す
  if (hud) {
    hud.setScore(0, 0);
    hud.clearGameOver();
    hud.clearTitle();
  }
  // パドルを作り直す
  if (paddle1 && paddle2) {
    const { p1, p2 } = createPaddles(scene, settings);
    paddle1.mesh.dispose();
    paddle2.mesh.dispose();
    paddle1 = p1;
    paddle2 = p2;
  }
  // ボールをセンターへ
  if (ball && paddle1 && paddle2) {
    ball.stop();
    ball.velocity = new Vector3(0, 0, 0);
    ball.reset("center", paddle1, paddle2);
  }
  // センターからカウントダウンスタート
  if (hud && ball && paddle1 && paddle2) {
    countdownAndServe(
      "center",
      ball,
      paddle1,
      paddle2,
      gameState,
      hud,
      settings,
      UILockController,
    );
  }
}

// リセット無効化
const UILockController = {
  lock() {
    gameState.resetLocked = true;
    updateUIButtons();
  },
  unlock() {
    gameState.resetLocked = false;
    updateUIButtons();
  },
};

function updateUIButtons() {
  const gameRoot = document.getElementById(
    "pingpong-3d-root",
  ) as HTMLElement | null;
  if (!gameRoot) return;
  const btnReset = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-reset");
  if (!btnReset) return;

  const locked = gameState.resetLocked;
  btnReset.disabled = locked;
  btnReset.classList.toggle("btn-disabled", locked);
}

// ゲーム一時停止
export function pauseGame() {
  if (!isRunning || isPaused) return;
  if (gameState.phase !== "game") return;

  isPaused = true;
  gameState.phase = "pause";
}

// ゲーム再開
export function resumeGame() {
  if (!isRunning || !isPaused) return;
  if (gameState.phase === "gameover") return;

  isPaused = false;
  gameState.phase = "game";
}

// カメラリセット
export function resetCamera() {
  if (!stage) return;

  stage.resetCamera();
}
