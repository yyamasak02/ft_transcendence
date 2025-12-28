// src/game-main.ts ゲーム本体

import { Vector3, Color4, Mesh } from "@babylonjs/core";
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
import { GAME_CONFIG } from "./core/constants3D";

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
let wasEnterDown = false;
let lastRallyTime = 0;

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

export const gameState: GameState = {
  phase: "menu",
  rallyActive: true,
  isServing: false,
  lastWinner: null,
  resetLocked: false,
  countdownID: 0,
  rallyCount: 0,
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
  gameState.rallyCount = 0;
  lastRallyTime = 0;

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
  ball = new Ball(scene, initialBallPos, GAME_CONFIG.BALL_INITIAL_SPEED);
  ball.stop();
  ball.velocity = new Vector3(0, 0, 0);
  ball.reset("center", paddle1, paddle2);

  // stage作成
  stage = new Stage(scene, canvas, paddle1, paddle2, ball, settings);

  if (stage.camera) {
    const MENU_ALPHA = -Math.PI / 4;
    const MENU_BETA = Math.PI / 3;
    const MENU_RADIUS = 450;

    stage.camera.alpha = MENU_ALPHA;
    stage.camera.beta = MENU_BETA;
    stage.camera.radius = MENU_RADIUS;
  }

  hud.setScore(p1Score, p2Score);
  hud.hideScore();
  hud.showTitle();
  hud.startFloatingTextAnimation(scene);
  hud.setRallyCount(0);

  wasEnterDown = false;

  // ===== 描画ループ開始 ========================

  engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();

    if (paddle1 && paddle2 && ball) {
      if (gameState.phase === "menu") {
        const isEnterDown = isEnterPressed();
        if (isEnterDown && !wasEnterDown) {
          const gameRoot = document.getElementById("pingpong-3d-root");
          const helpOverlay =
            gameRoot?.querySelector<HTMLElement>("#help-overlay");
          const isHelpVisible =
            helpOverlay && helpOverlay.style.display === "flex";

          if (isHelpVisible) {
            helpOverlay.style.display = "none";
            updateUIButtons();
          } else {
            gameState.phase = "starting";
            handleEnterToStart();
          }
        }
        wasEnterDown = isEnterDown;
      } else if (gameState.phase === "game" && !isPaused) {
        // paddleの動き
        const allInputs = getPaddleInputs();

        if (aiController) {
          p2Input = aiController.getInputs(ball, paddle2);
        } else {
          p2Input = allInputs.p2;
        }

        const onPaddleMove = () => {
          if (stage && paddle1 && paddle2) {
            stage.updateDestruction(paddle1, paddle2);
          }
        };

        const isRallyRush = settings.rallyRush;
        paddle1.updateRallyPosition(
          gameState.rallyCount,
          isRallyRush,
          onPaddleMove,
        );
        paddle2.updateRallyPosition(
          gameState.rallyCount,
          isRallyRush,
          onPaddleMove,
        );

        paddle1.update(deltaTime, allInputs.p1);
        paddle2.update(deltaTime, p2Input);

        const collisionWrapper = (ballMesh: Mesh, paddle: Paddle) => {
          const hit = checkPaddleCollision(ballMesh, paddle);
          const now = Date.now();

          if (hit && now - lastRallyTime > 100) {
            lastRallyTime = now;
            gameState.rallyCount++;

            if (hud) hud.setRallyCount(gameState.rallyCount);

            if (
              isRallyRush &&
              gameState.rallyCount > 0 &&
              gameState.rallyCount % 10 === 0
            ) {
              const level = gameState.rallyCount / 10;
              if (level <= 4 && hud) {
                hud.showNotification("further forward!!!");
              }
            }
          }
          return hit;
        };

        const result = ball.update(
          deltaTime,
          paddle1,
          paddle2,
          gameState,
          collisionWrapper,
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
  hud.showRallyText();
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
  gameState.rallyCount = 0;
  hud.setRallyCount(0);
  paddle1.updateRallyPosition(0, settings.rallyRush);
  paddle2.updateRallyPosition(0, settings.rallyRush);

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
  if (stage) {
    stage.resetCourt();
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
  gameState.rallyCount = 0;
  hud.setRallyCount(0);
  hud.hideRallyText();

  UILockController.lock();

  isRunning = false;
  isPaused = false;

  hud.clearCountdown();

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
    hud.dispose();
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
  gameState.rallyCount = 0;

  p1Score = 0;
  p2Score = 0;

  // keyboardListenerの解除
  cleanupKeyboardListener();
  stopZoomOut();
  disposeWinEffect();

  // hudの破棄
  if (hud) {
    hud.dispose();
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
  gameState.rallyCount = 0;
  p1Score = 0;
  p2Score = 0;

  // スコアを戻す
  if (hud) {
    hud.setScore(0, 0);
    hud.clearGameOver();
    hud.clearTitle();
    hud.setRallyCount(0);
    hud.showRallyText();
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

function updateUIButtons() {
  const gameRoot = document.getElementById(
    "pingpong-3d-root",
  ) as HTMLElement | null;
  if (!gameRoot) return;
  // 暗幕
  const overlay = gameRoot.querySelector<HTMLElement>("#pause-overlay");

  // 左上UI
  const helpOverlay = gameRoot.querySelector<HTMLElement>("#help-overlay");
  const btnHelp = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-help");
  const btnHomeNav =
    gameRoot.querySelector<HTMLButtonElement>("#btn-3d-home-nav");
  const btnSettingsNav = gameRoot.querySelector<HTMLButtonElement>(
    "#btn-3d-settings-nav",
  );
  const btnPause = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-pause");
  const btnCameraReset = gameRoot.querySelector<HTMLButtonElement>(
    "#btn-3d-camera-reset",
  );

  // 中央ポーズメニュー
  const centralBtns =
    gameRoot.querySelectorAll<HTMLButtonElement>(".central-btn");
  const btnReset = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-reset");

  const hide = (el: HTMLElement | null) => el && (el.style.display = "none");
  const show = (el: HTMLElement | null) =>
    el && (el.style.display = "inline-flex");

  const isHelpVisible = helpOverlay && helpOverlay.style.display === "flex";
  if (gameState.phase === "menu") {
    if (overlay) overlay.style.display = "none";
    centralBtns.forEach((btn) => hide(btn));

    if (isHelpVisible) {
      hide(btnHomeNav);
      hide(btnSettingsNav);
      hide(btnHelp);
    } else {
      show(btnHomeNav);
      show(btnSettingsNav);
      show(btnHelp);
    }

    hide(btnPause);
    hide(btnCameraReset);
  } else if (gameState.phase === "game" && !isPaused) {
    if (overlay) overlay.style.display = "none";
    hide(helpOverlay);
    centralBtns.forEach((btn) => hide(btn));

    hide(btnHomeNav);
    hide(btnSettingsNav);
    hide(btnHelp);
    show(btnPause);
    show(btnCameraReset);
  } else if (gameState.phase === "pause") {
    if (overlay) overlay.style.display = "block";
    hide(helpOverlay);
    centralBtns.forEach((btn) => show(btn));

    hide(btnHomeNav);
    hide(btnSettingsNav);
    hide(btnHelp);
    hide(btnPause);
    show(btnCameraReset);
  } else {
    if (overlay) overlay.style.display = "none";
    hide(helpOverlay);
    centralBtns.forEach((btn) => hide(btn));
    hide(btnHomeNav);
    hide(btnSettingsNav);
    hide(btnHelp);
    hide(btnPause);
    hide(btnCameraReset);
  }

  if (btnReset) {
    const locked = gameState.resetLocked;
    btnReset.disabled = locked;
    btnReset.classList.toggle("btn-disabled", locked);
  }
}

// ゲーム一時停止
export function pauseGame() {
  if (!isRunning || isPaused) return;
  if (gameState.phase !== "game") return;

  isPaused = true;
  gameState.phase = "pause";
  updateUIButtons();
}

// ゲーム再開
export function resumeGame() {
  if (!isRunning || !isPaused) return;
  if (gameState.phase === "gameover") return;

  isPaused = false;
  gameState.phase = "game";
  updateUIButtons();
}

// カメラリセット
export function resetCamera() {
  if (!stage) return;

  stage.resetCamera();
}
