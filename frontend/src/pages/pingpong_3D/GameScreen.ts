// src/game-main.ts
import { Vector3, Color4, Mesh, Engine, Scene } from "@babylonjs/core";
import { loadSettings } from "../../utils/pingpong3D/gameSettings";
import { Ball } from "./object/Ball";
import { Paddle, createPaddles } from "./object/Paddle";
import type { PaddleInput } from "./object/Paddle";
import { Stage } from "./object/Stage";
import {
  checkPaddleCollision,
  countdownAndServe,
} from "./object/ballPaddleUtils";
import { GameHUD } from "./object/ui3D/GameHUD";
import type { GameState } from "./core/game";
import { disposeWinEffect, createWinEffect } from "./object/effect/finEffect";
import {
  stopZoomOut,
  transitionToPlayView,
  cutIn,
  zoomOut,
} from "./object/effect/cameraWork";
import { navigate } from "@/router";
import { AIController } from "./object/AI/AI";
import { GAME_CONFIG } from "./core/constants3D";
import type { GameSettings } from "../../utils/pingpong3D/gameSettings";
import { InputManager } from "./input/keyboard";

const MAIN_CONSTS = {
  RALLY_DEBOUNCE_MS: 100,
  RALLY_NOTIFICATION: { INTERVAL: 10, MAX_LEVEL: 4 },
} as const;

// TODO 意味のある分割にする。データの扱う範囲の制限
export class GameScreen {
  private settings: GameSettings = loadSettings();
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private ball: Ball | null = null;
  private paddle1: Paddle | null = null;
  private paddle2: Paddle | null = null;
  private stage: Stage | null = null;
  private hud: GameHUD | null = null;
  private aiController: AIController | null = null;
  private p1Score: number = 0;
  private p2Score: number = 0;
  private p2Input: PaddleInput = { up: false, down: false };
  private wasEnterDown: boolean = false;
  private lastRallyTime: number = 0;
  public gameState: GameState = {
    phase: "menu",
    rallyActive: true,
    isServing: false,
    lastWinner: null,
    resetLocked: false,
    countdownID: 0,
    rallyCount: 0,
  };
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private inputManager: InputManager;
  private gameRoot: HTMLElement;
  private uiLockController: any;

  constructor(canvas: HTMLCanvasElement, gameRoot: HTMLElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);
    this.inputManager = new InputManager({
      onResize: () => {
        this.engine.resize();
      },
      onKeyDown: (keys) => {
        if (keys["Enter"]) {
          console.log("Enter pressed");
        }
      },
    });
    this.gameRoot = gameRoot;
    this.uiLockController = {
      lock: () => {
        this.gameState.resetLocked = true;
        this.updateUIButtons();
      },
      unlock: () => {
        this.gameState.resetLocked = false;
        this.updateUIButtons();
      },
    };
  }

  // ------------------------
  // 設定をリロード
  // ------------------------
  reloadSettings() {
    this.settings = loadSettings();
  }

  // ------------------------
  // ゲーム開始
  // ------------------------
  startGame() {
    if (this.isRunning) return;

    this.reloadSettings();
    this.isRunning = true;
    this.isPaused = false;
    this.lastRallyTime = 0;
    this.p1Score = 0;
    this.p2Score = 0;

    if (this.settings.player2Type !== "Player") {
      this.aiController = new AIController(this.settings.player2Type);
    } else {
      this.aiController = null;
    }

    this.hud = new GameHUD(this.scene);
    this.inputManager.setup();

    const { p1, p2 } = createPaddles(this.scene, this.settings);
    this.paddle1 = p1;
    this.paddle2 = p2;

    this.ball = new Ball(
      this.scene,
      new Vector3(0, 1, 0),
      GAME_CONFIG.BALL_INITIAL_SPEED,
    );
    this.ball.stop();
    this.ball.velocity = new Vector3(0, 0, 0);
    this.ball.reset("center", this.paddle1, this.paddle2);

    this.stage = new Stage(
      this.scene,
      this.canvas,
      this.paddle1,
      this.paddle2,
      this.ball,
      this.settings,
    );

    if (this.stage.camera) {
      const MENU_ALPHA = -Math.PI / 4;
      const MENU_BETA = Math.PI / 3;
      const MENU_RADIUS = 450;
      this.stage.camera.alpha = MENU_ALPHA;
      this.stage.camera.beta = MENU_BETA;
      this.stage.camera.radius = MENU_RADIUS;
    }

    this.hud.setScore(this.p1Score, this.p2Score);
    this.hud.hideScore();
    this.hud.showTitle();
    this.hud.startFloatingTextAnimation(this.scene);
    this.hud.setRallyCount(0);

    this.wasEnterDown = false;
    this.gameState.phase = "menu";
    this.gameState.rallyActive = false;
    this.gameState.isServing = false;
    this.gameState.lastWinner = null;
    this.gameState.countdownID = 0;
    this.gameState.resetLocked = false;
    this.gameState.rallyCount = 0;

    this.scene.clearColor = new Color4(0, 0, 0, 0.5);
    // 初期UI状態を反映（中央メニューを非表示など）
    this.updateUIButtons();

    this.engine.runRenderLoop(() => this.gameLoop());
  }

  // ------------------------
  // ゲーム停止
  // ------------------------
  stopGame() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = false;
    this.gameState.phase = "menu";
    this.gameState.rallyActive = true;
    this.gameState.isServing = false;
    this.gameState.lastWinner = null;
    this.gameState.rallyCount = 0;
    this.p1Score = 0;
    this.p2Score = 0;
    this.inputManager.cleanup();
    stopZoomOut();
    disposeWinEffect();

    if (this.hud) {
      this.hud.dispose();
      this.hud = null;
    }
    if (this.ball) {
      this.ball.stop();
      this.ball = null;
    }
    this.paddle1 = null;
    this.paddle2 = null;
    if (this.scene && !this.scene.isDisposed) this.scene.dispose();
    if (this.engine) {
      this.engine.stopRenderLoop();
      this.engine.dispose();
    }
  }

  // ------------------------
  // ゲームリセット
  // ------------------------
  resetGame() {
    if (
      !this.isRunning ||
      !this.scene ||
      this.scene.isDisposed ||
      this.gameState.resetLocked
    )
      return;

    this.gameState.countdownID++;
    this.reloadSettings();
    this.isPaused = false;
    this.gameState.phase = "game";
    this.gameState.rallyActive = false;
    this.gameState.isServing = false;
    this.gameState.lastWinner = null;
    this.gameState.rallyCount = 0;
    this.p1Score = 0;
    this.p2Score = 0;

    if (this.hud) {
      this.hud.setScore(0, 0);
      this.hud.clearGameOver();
      this.hud.clearTitle();
      this.hud.setRallyCount(0);
      this.hud.showRallyText();
    }

    if (this.paddle1 && this.paddle2) {
      const { p1, p2 } = createPaddles(this.scene, this.settings);
      this.paddle1.mesh.dispose();
      this.paddle2.mesh.dispose();
      this.paddle1 = p1;
      this.paddle2 = p2;
    }

    if (this.ball && this.paddle1 && this.paddle2) {
      this.ball.stop();
      this.ball.velocity = new Vector3(0, 0, 0);
      this.ball.reset("center", this.paddle1, this.paddle2);
    }

    if (this.stage) this.stage.resetCourt();
    if (this.stage) this.stage.resetCourt();
    if (this.hud && this.ball && this.paddle1 && this.paddle2) {
      countdownAndServe(
        "center",
        this.ball,
        this.paddle1,
        this.paddle2,
        this.gameState,
        this.hud,
        this.settings,
        this.uiLockController,
      );
    }
  }

  // ------------------------
  // ゲーム一時停止 / 再開
  // ------------------------
  pauseGame() {
    if (!this.isRunning || this.isPaused) return;
    if (this.gameState.phase !== "game") return;

    this.isPaused = true;
    this.gameState.phase = "pause";
    this.updateUIButtons();
  }

  resumeGame() {
    if (!this.isRunning || !this.isPaused) return;
    if (this.gameState.phase === "gameover") return;

    this.isPaused = false;
    this.gameState.phase = "game";
    this.updateUIButtons();
  }

  // ------------------------
  // カメラリセット
  // ------------------------
  resetCamera() {
    if (!this.stage) return;
    this.stage.resetCamera();
  }

  // ------------------------
  // UI更新
  // ------------------------
  updateUIButtons() {
    const overlay = this.gameRoot.querySelector<HTMLElement>("#pause-overlay");
    // 左上UI
    const helpOverlay =
      this.gameRoot.querySelector<HTMLElement>("#help-overlay");
    const btnHelp =
      this.gameRoot.querySelector<HTMLButtonElement>("#btn-3d-help");
    const btnHomeNav =
      this.gameRoot.querySelector<HTMLButtonElement>("#btn-3d-home-nav");
    const btnSettingsNav = this.gameRoot.querySelector<HTMLButtonElement>(
      "#btn-3d-settings-nav",
    );
    const btnPause =
      this.gameRoot.querySelector<HTMLButtonElement>("#btn-3d-pause");
    const btnCameraReset = this.gameRoot.querySelector<HTMLButtonElement>(
      "#btn-3d-camera-reset",
    );

    // 中央ポーズメニュー
    const centralBtns =
      this.gameRoot.querySelectorAll<HTMLButtonElement>(".central-btn");
    const btnReset =
      this.gameRoot.querySelector<HTMLButtonElement>("#btn-3d-reset");

    const hide = (el: HTMLElement | null) => el && (el.style.display = "none");
    const show = (el: HTMLElement | null) =>
      el && (el.style.display = "inline-flex");

    const isHelpVisible = helpOverlay && helpOverlay.style.display === "flex";
    if (this.gameState.phase === "menu") {
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
    } else if (this.gameState.phase === "game" && !this.isPaused) {
      if (overlay) overlay.style.display = "none";
      hide(helpOverlay);
      centralBtns.forEach((btn) => hide(btn));

      hide(btnHomeNav);
      hide(btnSettingsNav);
      hide(btnHelp);
      show(btnPause);
      show(btnCameraReset);
    } else if (this.gameState.phase === "pause") {
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
      const locked = this.gameState.resetLocked;
      btnReset.disabled = locked;
      btnReset.classList.toggle("btn-disabled", locked);
    }
  }

  // ------------------------
  // ゲームループ
  // ------------------------
  private gameLoop() {
    if (!this.paddle1 || !this.paddle2 || !this.ball) return;

    const deltaTime = this.engine.getDeltaTime();

    if (this.gameState.phase === "menu") {
      const isEnterDown = this.inputManager.isEnterPressed();
      if (isEnterDown && !this.wasEnterDown) {
        const helpOverlay =
          this.gameRoot.querySelector<HTMLElement>("#help-overlay");
        const isHelpVisible =
          helpOverlay && helpOverlay.style.display === "flex";

        if (isHelpVisible) {
          helpOverlay.style.display = "none";
          this.updateUIButtons();
        } else {
          this.gameState.phase = "starting";
          this.handleEnterToStart();
        }
      }
      this.wasEnterDown = isEnterDown;
    }

    // ゲーム進行処理は元コードをほぼコピー
    if (this.gameState.phase === "game" && !this.isPaused) {
      const allInputs = this.inputManager.getPaddleInputs();
      if (this.aiController)
        this.p2Input = this.aiController.getInputs(this.ball, this.paddle2);
      else this.p2Input = allInputs.p2;

      // ラリーラッシュによるX方向の前進とステージ崩壊の更新
      const isRallyRush = this.settings.rallyRush;
      const onPaddleMove = () => {
        if (this.stage && this.paddle1 && this.paddle2) {
          this.stage.updateDestruction(this.paddle1, this.paddle2);
        }
      };
      this.paddle1.updateRallyPosition(
        this.gameState.rallyCount,
        isRallyRush,
        onPaddleMove,
      );
      this.paddle2.updateRallyPosition(
        this.gameState.rallyCount,
        isRallyRush,
        onPaddleMove,
      );

      this.paddle1.update(deltaTime, allInputs.p1);
      this.paddle2.update(deltaTime, this.p2Input);

      const collisionWrapper = (ballMesh: Mesh, paddle: Paddle) => {
        const hit = checkPaddleCollision(ballMesh, paddle);
        const now = Date.now();
        if (hit && now - this.lastRallyTime > MAIN_CONSTS.RALLY_DEBOUNCE_MS) {
          this.lastRallyTime = now;
          this.gameState.rallyCount++;
          if (this.hud) this.hud.setRallyCount(this.gameState.rallyCount);
        }
        return hit;
      };

      const result = this.ball.update(
        deltaTime,
        this.paddle1,
        this.paddle2,
        this.gameState,
        collisionWrapper,
      );
      if (result) {
        this.onScore(result.scorer);
      }
    }

    this.scene.render();
  }

  private handleEnterToStart() {
    if (
      !this.hud ||
      !this.stage ||
      !this.stage.camera ||
      !this.ball ||
      !this.paddle1 ||
      !this.paddle2
    )
      return;

    this.hud.clearTitle();
    this.hud.stopFloatingTextAnimation(this.scene);

    transitionToPlayView(this.stage.camera, 1500).then(() => {
      this.hud.showScore();
      this.hud.showRallyText();
      this.gameState.phase = "game";

      countdownAndServe(
        "center",
        this.ball!,
        this.paddle1!,
        this.paddle2!,
        this.gameState,
        this.hud!,
        this.settings,
        this.uiLockController,
      );
    });
  }

  private onScore(scorer: 1 | 2) {
    if (!this.hud || !this.ball || !this.paddle1 || !this.paddle2) return;

    // ラリーリセット
    this.gameState.rallyCount = 0;
    this.hud.setRallyCount(0);

    // 設定の再読込（勝利スコアなど反映）
    this.reloadSettings();
    const winningScore = this.settings.winningScore;

    // スコア更新
    if (scorer === 1) {
      this.p1Score++;
      this.gameState.lastWinner = 1;
    } else {
      this.p2Score++;
      this.gameState.lastWinner = 2;
    }
    this.hud.setScore(this.p1Score, this.p2Score);

    // 勝利判定
    if (this.p1Score >= winningScore || this.p2Score >= winningScore) {
      const winner = this.p1Score >= winningScore ? 1 : 2;
      this.endGame(winner);
      return;
    }
    // パドルのX前進を元へ戻し、コートをリセット
    this.paddle1.updateRallyPosition(0, this.settings.rallyRush);
    this.paddle2.updateRallyPosition(0, this.settings.rallyRush);
    if (this.stage) this.stage.resetCourt();
    countdownAndServe(
      this.gameState.lastWinner!,
      this.ball,
      this.paddle1,
      this.paddle2,
      this.gameState,
      this.hud,
      this.settings,
      this.uiLockController,
    );
  }

  private endGame(winner: 1 | 2) {
    if (!this.hud) return;
    this.gameState.countdownID++;
    this.gameState.phase = "gameover";
    this.gameState.isServing = false;
    this.gameState.rallyActive = false;
    this.gameState.rallyCount = 0;
    this.hud.setRallyCount(0);
    this.hud.hideRallyText();

    this.uiLockController.lock();
    this.isRunning = false;
    this.isPaused = false;

    if (this.ball) this.ball.stop();

    this.endGameDirection(winner);

    // リザルト表示は5秒後
    window.setTimeout(() => {
      if (this.hud) {
        this.hud.showFinalResult(
          winner === 1 ? "Player1" : "Player2",
          this.p1Score,
          this.p2Score,
        );
      }
    }, 5000);

    // 後始末＋Home遷移は15秒後
    window.setTimeout(() => {
      this.cleanupAndGoHome();
    }, 15000);
  }

  private async endGameDirection(winner: 1 | 2) {
    if (!this.scene || !this.stage || !this.stage.camera || !this.ball) return;
    const TARGET_RADIUS = 150;
    const ZOOM_OUT_DURATION_MS = 10000;
    createWinEffect(this.scene, winner);
    await cutIn(this.stage.camera, this.ball.mesh.position);
    stopZoomOut();
    zoomOut(this.stage.camera, TARGET_RADIUS, ZOOM_OUT_DURATION_MS);
  }

  private cleanupAndGoHome() {
    stopZoomOut();
    disposeWinEffect();
    this.inputManager.cleanup();
    if (this.hud) {
      this.hud.dispose();
      this.hud = null;
    }
    if (this.scene && !this.scene.isDisposed) this.scene.dispose();
    if (this.engine) {
      this.engine.stopRenderLoop();
      this.engine.dispose();
    }
    navigate("/");
  }
}
