// src/pages/pingpong_3D/GameScreen.ts
import { Vector3, Color4, Mesh, Engine, Scene } from "@babylonjs/core";
import { loadSettings } from "../../../utils/pingpong3D/gameSettings";
import { Ball } from "./Ball";
import { createPaddles } from "./Paddle";
import type { Paddle } from "./Paddle";
import { Stage } from "./Stage";
import { checkPaddleCollision, countdownAndServe } from "./ballPaddleUtils";
import type { UILockController } from "./ballPaddleUtils";
import { GameHUD } from "./ui3D/GameHUD";
import type { GameState } from "../core/game";
import { disposeWinEffect, createWinEffect } from "./effect/finEffect";
import {
  stopZoomOut,
  transitionToPlayView,
  cutIn,
  zoomOut,
} from "./effect/cameraWork";
import { navigate } from "@/router";
import { GAME_CONFIG } from "../core/constants3D";
import type { GameSettings } from "../../../utils/pingpong3D/gameSettings";
import { InputManager } from "../input/keyboard";
import { getStoredAccessToken } from "../../../utils/token-storage";
import { Player } from "./player/Player";
import { HumanController } from "./player/HumanController";
import { AIController } from "./player/AIController";
import { RemoteController } from "./player/RemoteController";
import type { GamePhase } from "../core/game";

const MAIN_CONSTS = {
  RALLY_DEBOUNCE_MS: 100,
  RALLY_NOTIFICATION: { INTERVAL: 10, MAX_LEVEL: 4 },
  MENU_CAMERA: {
    ALPHA: -Math.PI / 4,
    BETA: Math.PI / 3,
    RADIUS: 450,
  },
  TRANSITION_DURATION: {
    CAMERA_TO_PLAY: 1500,
    RESULT_DISPLAY: 5000,
    HOME_NAVIGATION: 15000,
  },
  END_GAME_CAMERA: {
    TARGET_RADIUS: 150,
    ZOOM_OUT_DURATION: 10000,
  },
  REMOTE_RESULT: {
    SUBMIT_TIMEOUT_MS: 5000,
  },
} as const;

export class GameScreen {
  private settings: GameSettings = loadSettings();
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private ball: Ball | null = null;
  private player1: Player | null = null;
  private player2: Player | null = null;
  private stage: Stage | null = null;
  private hud: GameHUD | null = null;
  private p1Score: number = 0;
  private p2Score: number = 0;
  private wasMenuConfirmDown: boolean = false;
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

  private readonly REMOTE_GUEST_USER_ID = "guest";
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private inputManager: InputManager;
  private onUIUpdate?: (phase: GamePhase, resetLocked: boolean) => void;
  private uiLockController: UILockController;
  // Remote mode
  private remoteMode: boolean = false;
  private remoteRoomId: string | null = null;
  private remoteUserId: string | null = null;
  private remoteSide: "p1" | "p2" = "p1";
  private remoteStartAt: number | null = null;
  private remoteWS: WebSocket | null = null;
  private remoteOpponentCtrl: RemoteController | null = null;
  private lastSentDirection: "up" | "down" | "stop" = "stop";
  private serverAuthority: boolean = false;
  private serverState: any = null;
  private serverStarted: boolean = false;
  private remoteResultSubmitted: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    onUIUpdate?: (phase: GamePhase, resetLocked: boolean) => void,
  ) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);
    this.inputManager = new InputManager({
      onResize: () => {
        this.engine.resize();
      },
    });
    this.onUIUpdate = onUIUpdate;
    this.uiLockController = {
      lock: () => {
        this.gameState.resetLocked = true;
        this.notifyUIUpdate();
      },
      unlock: () => {
        this.gameState.resetLocked = false;
        this.notifyUIUpdate();
      },
    };

    // parse remote mode query params
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "remote") {
      this.remoteMode = true;
      this.remoteRoomId = params.get("roomId");
      this.remoteUserId = params.get("userId");
      const side = params.get("side");
      this.remoteSide = side === "p2" ? "p2" : "p1";
      const startAt = params.get("startAt");
      this.remoteStartAt = startAt ? Number(startAt) : null;
      this.serverAuthority = params.get("auth") === "server";
    }
  }

  getInputManager(): InputManager {
    return this.inputManager;
  }

  private applyServerState() {
    if (!this.serverState || !this.player1 || !this.player2 || !this.ball)
      return;
    const courtW = GAME_CONFIG.COURT_WIDTH;
    const courtH = GAME_CONFIG.COURT_HEIGHT;

    // Apply ball position from server
    const x = (this.serverState.ball?.x ?? 0) * (courtW / 2);
    const z = (this.serverState.ball?.y ?? 0) * (courtH / 2);
    this.ball.mesh.position.x = x;
    this.ball.mesh.position.z = z;

    const serverP1x = this.serverState.players?.p1?.x ?? 0;
    const serverP1y = this.serverState.players?.p1?.y ?? 0;
    const serverP2x = this.serverState.players?.p2?.x ?? 0;
    const serverP2y = this.serverState.players?.p2?.y ?? 0;

    this.player1.paddle.mesh.position.x = serverP1x * (courtW / 2);
    this.player1.paddle.mesh.position.z = serverP1y * (courtH / 2);
    this.player2.paddle.mesh.position.x = serverP2x * (courtW / 2);
    this.player2.paddle.mesh.position.z = serverP2y * (courtH / 2);

    // Apply score from server
    if (this.serverState.score) {
      const newP1Score = this.serverState.score.p1 ?? 0;
      const newP2Score = this.serverState.score.p2 ?? 0;
      if (newP1Score !== this.p1Score || newP2Score !== this.p2Score) {
        this.p1Score = newP1Score;
        this.p2Score = newP2Score;
        if (this.hud) {
          this.hud.setScore(this.p1Score, this.p2Score);
        }
      }
    }

    // ラリー数カウント
    if (typeof this.serverState.rallyCount === "number") {
      if (this.gameState.rallyCount !== this.serverState.rallyCount) {
        this.gameState.rallyCount = this.serverState.rallyCount;
        if (this.hud) {
          this.hud.setRallyCount(this.gameState.rallyCount);
        }
      }
    }

    // Apply countdown from server (if in countdown phase)
    if (
      this.serverState.status === "countdown" &&
      this.serverState.countdown > 0 &&
      this.hud
    ) {
      const countdownValue = Math.ceil(this.serverState.countdown);
      this.hud.setCountdown(String(countdownValue));
    } else if (this.hud && this.serverState.status === "playing") {
      this.hud.clearCountdown();
    }
  }
  private initPlayers(
    p1: Paddle,
    p2: Paddle,
  ): { player1: Player; player2: Player } {
    let player1: Player;
    let player2: Player;
    if (this.remoteMode) {
      const oppCtrl = new RemoteController();
      this.remoteOpponentCtrl = oppCtrl;
      if (this.remoteSide === "p1") {
        // Host (side="p1"): control player1(left) with ArrowUp/Down
        player1 = new Player(p1, new HumanController(this.inputManager, 1), 1);
        player2 = new Player(p2, oppCtrl, 2);
      } else {
        // Guest (side="p2"): control player2(right) with ArrowUp/Down
        player1 = new Player(p1, oppCtrl, 1);
        player2 = new Player(p2, new HumanController(this.inputManager, 2), 2);
      }
      return { player1, player2 };
    }

    const humanController1 = new HumanController(this.inputManager, 1);
    player1 = new Player(p1, humanController1, 1);

    if (this.settings.player2Type !== "Player") {
      const aiController = new AIController(this.settings.player2Type);
      player2 = new Player(p2, aiController, 2);
    } else {
      const humanController2 = new HumanController(this.inputManager, 2);
      player2 = new Player(p2, humanController2, 2);
    }
    return { player1, player2 };
  }

  // ------------------------
  // UI更新通知
  // ------------------------
  private notifyUIUpdate() {
    this.onUIUpdate?.(this.gameState.phase, this.gameState.resetLocked);
  }

  // ------------------------
  // ゲーム開始
  // ------------------------
  startGame() {
    if (this.isRunning) return;

    this.settings = loadSettings();
    this.isRunning = true;
    this.isPaused = false;
    this.lastRallyTime = 0;
    this.p1Score = 0;
    this.p2Score = 0;

    this.hud = new GameHUD(this.scene);
    this.inputManager.setup(this.canvas);

    // パドル生成 + プレイヤー生成（共通ロジック）
    const { p1, p2 } = createPaddles(this.scene, this.settings);
    const { player1, player2 } = this.initPlayers(p1, p2);
    this.player1 = player1;
    this.player2 = player2;

    this.ball = new Ball(
      this.scene,
      new Vector3(0, 1, 0),
      GAME_CONFIG.BALL_INITIAL_SPEED,
    );
    this.ball.stop();
    this.ball.velocity = new Vector3(0, 0, 0);
    this.ball.reset("center", player1.paddle, player2.paddle);

    this.stage = new Stage(
      this.scene,
      this.canvas,
      player1.paddle,
      player2.paddle,
      this.ball,
      this.settings,
    );

    if (this.stage.camera) {
      this.stage.camera.alpha = MAIN_CONSTS.MENU_CAMERA.ALPHA;
      this.stage.camera.beta = MAIN_CONSTS.MENU_CAMERA.BETA;
      this.stage.camera.radius = MAIN_CONSTS.MENU_CAMERA.RADIUS;
    }

    this.hud.setScore(this.p1Score, this.p2Score);
    this.hud.hideScore();
    this.hud.showTitle();
    this.hud.startFloatingTextAnimation(this.scene);
    this.hud.setRallyCount(0);

    this.wasMenuConfirmDown = false;
    this.gameState.phase = "menu";
    this.gameState.rallyActive = false;
    this.gameState.isServing = false;
    this.gameState.lastWinner = null;
    this.gameState.countdownID = 0;
    this.gameState.resetLocked = false;
    this.gameState.rallyCount = 0;
    this.remoteResultSubmitted = false;

    this.scene.clearColor = new Color4(0, 0, 0, 0.5);
    // 初期UI状態を反映（中央メニューを非表示など）
    this.notifyUIUpdate();

    this.engine.runRenderLoop(() => this.gameLoop());

    if (this.remoteMode) {
      this.setupRemoteWS();
    }
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
    if (this.remoteWS) {
      try {
        this.remoteWS.close();
      } catch {
        // TODO error handling
      }
      this.remoteWS = null;
    }
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
    if (this.player1) {
      this.player1.dispose();
      this.player1 = null;
    }
    if (this.player2) {
      this.player2.dispose();
      this.player2 = null;
    }
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
    this.settings = loadSettings();
    this.isPaused = false;
    this.gameState.phase = "game";
    this.gameState.rallyActive = false;
    this.gameState.isServing = false;
    this.gameState.lastWinner = null;
    this.gameState.rallyCount = 0;
    this.p1Score = 0;
    this.p2Score = 0;
    this.notifyUIUpdate();

    if (this.hud) {
      this.hud.setScore(0, 0);
      this.hud.clearGameOver();
      this.hud.clearTitle();
      this.hud.setRallyCount(0);
      this.hud.showRallyText();
    }

    if (this.player1 && this.player2) {
      const { p1, p2 } = createPaddles(this.scene, this.settings);

      // 古いパドルを破棄
      this.player1.paddle.mesh.dispose();
      this.player2.paddle.mesh.dispose();

      // 新しいパドルでプレイヤーを再生成（共通ロジック）
      const { player1, player2 } = this.initPlayers(p1, p2);
      this.player1 = player1;
      this.player2 = player2;
    }

    if (this.ball && this.player1 && this.player2) {
      this.ball.stop();
      this.ball.velocity = new Vector3(0, 0, 0);
      this.ball.reset("center", this.player1.paddle, this.player2.paddle);
    }

    if (this.stage) this.stage.resetCourt();
    if (this.hud && this.ball && this.player1 && this.player2) {
      countdownAndServe(
        "center",
        this.ball,
        this.player1.paddle,
        this.player2.paddle,
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
    this.notifyUIUpdate();
  }

  resumeGame() {
    if (!this.isRunning || !this.isPaused) return;
    if (this.gameState.phase === "gameover") return;

    this.isPaused = false;
    this.gameState.phase = "game";
    this.notifyUIUpdate();
  }

  // ------------------------
  // カメラリセット
  // ------------------------
  resetCamera() {
    if (!this.stage) return;
    this.stage.resetCamera();
  }

  // ------------------------
  // ゲームループ
  // ------------------------
  private gameLoop() {
    if (!this.player1 || !this.player2 || !this.ball) return;

    this.inputManager.setTapToStartAccepting(this.gameState.phase === "menu");

    const deltaTime = this.engine.getDeltaTime();

    // Apply server state early in server-authoritative mode (for countdown display)
    if (this.remoteMode && this.serverAuthority && this.serverState) {
      this.applyServerState();
    }

    if (this.gameState.phase === "menu") {
      if (this.remoteMode) {
        if (this.serverAuthority) {
          // In server-authoritative mode, start when we receive the first game:state
          if (
            this.serverState &&
            this.serverState.status &&
            !this.serverStarted
          ) {
            this.serverStarted = true;
            this.gameState.phase = "starting";
            this.handleEnterToStart();
          }
        } else if (this.remoteStartAt && Date.now() >= this.remoteStartAt) {
          this.gameState.phase = "starting";
          this.handleEnterToStart();
          this.remoteStartAt = null;
        }
      } else {
        const tapEdge = this.inputManager.consumeTapToStart();
        const enterDown = this.inputManager.isEnterPressed();
        const confirmDown = enterDown || tapEdge;
        if (confirmDown && !this.wasMenuConfirmDown) {
          this.gameState.phase = "starting";
          this.handleEnterToStart();
        }
        this.wasMenuConfirmDown = confirmDown;
      }
    }

    // ゲーム進行処理
    if (this.gameState.phase === "game" && !this.isPaused) {
      if (this.remoteMode && this.serverAuthority) {
        // Server-authoritative mode: server state already applied above
        // pass
      } else {
        // Client-authoritative or local mode: run full game logic
        // プレイヤー更新（入力取得 + パドル更新を統合）
        this.player1.update(deltaTime, this.ball);
        this.player2.update(deltaTime, this.ball);

        // ラリーラッシュによるX方向の前進とステージ崩壊の更新
        const isRallyRush = this.settings.rallyRush;
        const onPaddleMove = () => {
          if (this.stage && this.player1 && this.player2) {
            this.stage.updateDestruction(
              this.player1.paddle,
              this.player2.paddle,
            );
          }
        };
        this.player1.paddle.updateRallyPosition(
          this.gameState.rallyCount,
          isRallyRush,
          onPaddleMove,
        );
        this.player2.paddle.updateRallyPosition(
          this.gameState.rallyCount,
          isRallyRush,
          onPaddleMove,
        );

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
          this.player1.paddle,
          this.player2.paddle,
          this.gameState,
          collisionWrapper,
        );
        if (result) {
          this.onScore(result.scorer);
        }
      }
    }

    // remote: send local input changes (during game and countdown for server-authoritative mode)
    if (
      this.remoteMode &&
      this.remoteWS &&
      this.remoteWS.readyState === WebSocket.OPEN &&
      (this.gameState.phase === "game" ||
        (this.serverAuthority && this.gameState.phase !== "menu"))
    ) {
      const inputs = this.inputManager.getPaddleInputs();
      // Both players use inputs.p2 (ArrowUp/ArrowDown)
      const local = inputs.p1;
      const direction: "up" | "down" | "stop" = local.up
        ? "up"
        : local.down
          ? "down"
          : "stop";
      if (direction !== this.lastSentDirection) {
        this.lastSentDirection = direction;
        try {
          this.remoteWS?.send(
            JSON.stringify({
              type: "input:paddle",
              roomId: this.remoteRoomId,
              userId: this.remoteUserId,
              payload: { direction },
            }),
          );
        } catch {
          // TODO error handling
        }
      }
    }

    this.scene.render();
  }

  private setupRemoteWS() {
    if (!this.remoteRoomId || !this.remoteUserId) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${location.host}/ws/connect/ready`;
    const ws = new WebSocket(wsUrl);
    this.remoteWS = ws;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "connect",
          roomId: this.remoteRoomId,
          userId: this.remoteUserId,
        }),
      );
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!this.serverAuthority) {
          // Client-authoritative mode: relay opponent paddle input
          if (
            msg?.type === "input:paddle" &&
            msg?.payload?.direction &&
            this.remoteOpponentCtrl
          ) {
            const dir = msg.payload.direction as "up" | "down" | "stop";
            this.remoteOpponentCtrl.setDirection(dir);
          }
        }
        if (this.serverAuthority) {
          // Server-authoritative mode: receive complete game state
          if (msg?.type === "game:state" && msg?.payload) {
            this.serverState = msg.payload;
            // applyServerState will handle all updates in the game loop
          }
          if (msg?.type === "game:end") {
            const finalP1Score =
              typeof msg?.payload?.score?.p1 === "number"
                ? msg.payload.score.p1
                : typeof this.serverState?.score?.p1 === "number"
                  ? this.serverState.score.p1
                  : this.p1Score;
            const finalP2Score =
              typeof msg?.payload?.score?.p2 === "number"
                ? msg.payload.score.p2
                : typeof this.serverState?.score?.p2 === "number"
                  ? this.serverState.score.p2
                  : this.p2Score;

            this.p1Score = finalP1Score;
            this.p2Score = finalP2Score;
            this.hud?.setScore(this.p1Score, this.p2Score);

            void this.submitRemoteMatchResult(finalP1Score, finalP2Score);
            setTimeout(() => this.cleanupAndGoHome(), 3000);
          }
        }
      } catch {
        // TODO error handling
      }
    };
    ws.onclose = () => {
      this.remoteWS = null;
    };
  }

  private async submitRemoteMatchResult(ownerScore: number, guestScore: number) {
    if (
      !this.remoteMode ||
      !this.serverAuthority ||
      this.remoteSide !== "p1" ||
      this.remoteResultSubmitted ||
      !this.remoteRoomId
    ) {
      return;
    }
    this.remoteResultSubmitted = true;

    try {
      const statusRes = await fetch(
        `/api/connect/rooms/${encodeURIComponent(this.remoteRoomId)}/status`,
      );
      if (!statusRes.ok) {
        this.remoteResultSubmitted = false;
        return;
      }

      const room = (await statusRes.json()) as {
        hostUserId?: string;
        guestUserId?: string | null;
      };
      if (!room.hostUserId || !room.guestUserId) {
        this.remoteResultSubmitted = false;
        return;
      }
      if (room.hostUserId.toLowerCase() === this.REMOTE_GUEST_USER_ID) {
        console.info(
          "Skip remote match result submission because host user is guest.",
          { roomId: this.remoteRoomId, hostUserId: room.hostUserId },
        );
        return;
      }

      const controller = new AbortController();
      const timerId = window.setTimeout(() => {
        controller.abort();
      }, MAIN_CONSTS.REMOTE_RESULT.SUBMIT_TIMEOUT_MS);

      try {
        const resultRes = await fetch("/api/common/match_result/remote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getStoredAccessToken() ?? ""}`,
          },
          body: JSON.stringify({
            ownerUserId: room.hostUserId,
            guestUserId: room.guestUserId,
            ownerScore,
            guestScore,
          }),
          signal: controller.signal,
        });

        if (!resultRes.ok) {
          this.remoteResultSubmitted = false;
        }
      } finally {
        window.clearTimeout(timerId);
      }
    } catch {
      this.remoteResultSubmitted = false;
    }
  }

  private handleEnterToStart() {
    if (
      !this.hud ||
      !this.stage ||
      !this.stage.camera ||
      !this.ball ||
      !this.player1 ||
      !this.player2
    )
      return;

    this.hud.clearTitle();
    this.hud.stopFloatingTextAnimation(this.scene);

    transitionToPlayView(
      this.stage.camera,
      MAIN_CONSTS.TRANSITION_DURATION.CAMERA_TO_PLAY,
    ).then(() => {
      if (!this.hud) return;
      this.hud.showScore();
      this.hud.showRallyText();
      this.gameState.phase = "game";
      this.notifyUIUpdate();
      if (!this.remoteMode || !this.serverAuthority) {
        countdownAndServe(
          "center",
          this.ball!,
          this.player1!.paddle,
          this.player2!.paddle,
          this.gameState,
          this.hud!,
          this.settings,
          this.uiLockController,
        );
      }
    });
  }

  private onScore(scorer: 1 | 2) {
    if (!this.hud || !this.ball || !this.player1 || !this.player2) return;

    // ラリーリセット
    this.gameState.rallyCount = 0;
    this.hud.setRallyCount(0);

    // 設定の再読込（勝利スコアなど反映）
    this.settings = loadSettings();
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
    this.player1.paddle.updateRallyPosition(0, this.settings.rallyRush);
    this.player2.paddle.updateRallyPosition(0, this.settings.rallyRush);
    if (this.stage) this.stage.resetCourt();
    countdownAndServe(
      this.gameState.lastWinner!,
      this.ball,
      this.player1.paddle,
      this.player2.paddle,
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

    // リザルト表示
    window.setTimeout(() => {
      if (this.hud) {
        this.hud.showFinalResult(
          winner === 1 ? "Player1" : "Player2",
          this.p1Score,
          this.p2Score,
        );
      }
    }, MAIN_CONSTS.TRANSITION_DURATION.RESULT_DISPLAY);

    // 後始末＋Home遷移
    window.setTimeout(() => {
      this.cleanupAndGoHome();
    }, MAIN_CONSTS.TRANSITION_DURATION.HOME_NAVIGATION);
  }

  private async endGameDirection(winner: 1 | 2) {
    if (!this.scene || !this.stage || !this.stage.camera || !this.ball) return;
    createWinEffect(this.scene, winner);
    await cutIn(this.stage.camera, this.ball.mesh.position);
    stopZoomOut();
    zoomOut(
      this.stage.camera,
      MAIN_CONSTS.END_GAME_CAMERA.TARGET_RADIUS,
      MAIN_CONSTS.END_GAME_CAMERA.ZOOM_OUT_DURATION,
    );
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
