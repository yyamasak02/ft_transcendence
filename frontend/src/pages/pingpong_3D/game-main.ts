// src/game-main.ts ゲーム本体

import { Vector3, Color4, ArcRotateCamera } from "@babylonjs/core";
import { initDOMRefs, canvas, engine, scene } from "./core/data";
import { loadSettings } from "./core/gameSettings";
import { Ball } from "./object/Ball";
import { Paddle, createPaddles } from "./object/Paddle";
import { Stage } from "./object/Stage";
import { checkPaddleCollision, countdownAndServe } from "./object/ballPaddleUtils";
import { setupKeyboardListener, cleanupKeyboardListener, getPaddleInputs } from "./input/keyboard";
import { GameHUD } from "./object/ui3D/GameHUD";
import { navigate } from "@/router/router";
import type { GameState } from "./types/game";
import { createWinEffect } from "./object/effect/finEffect";

let settings = loadSettings();
let isRunning = false;
let isPaused = false;

let ball: Ball | null = null;
let paddle1: Paddle | null = null;
let paddle2: Paddle | null = null;
let stage: Stage | null = null;
let hud: GameHUD | null = null;
let gameStage: Stage | null = null;
let p1Score = 0;
let p2Score = 0;

export const gameState: GameState = {
	phase: "menu",
	rallyActive: true,
	isServing: false,
	lastWinner: null,
	resetLocked: false,
	countdownID: 0,
};

export function reloadSettings() { settings = loadSettings(); }

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
	
  initDOMRefs();
	const canvasEl = document.getElementById("gameCanvas3D");
	if (canvasEl) {
		canvasEl.addEventListener("click", () => {
			console.log("canvas clicked!");
		});
	}
	
	hud = new GameHUD(scene);
	setupKeyboardListener();
	
	gameState.phase = "game";
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
	setTimeout(() => {
		if (!scene || scene.isDisposed || !hud || !ball || !paddle1 || !paddle2) return;
		countdownAndServe("center", ball, paddle1, paddle2, gameState, hud, settings, UILockController);
	}, 0);
	
	// stage作成
	stage = new Stage(scene, canvas, paddle1, paddle2, ball, settings);
	gameStage = stage;

	// display作成
	hud.setScore(p1Score, p2Score);

  // ===== 描画ループ開始 ========================

	engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();
		
		if (paddle1 && paddle2 && ball) {
			if (gameState.phase === "game" && !isPaused) {
				// paddleの動き
				const { p1, p2 } = getPaddleInputs();
				paddle1.update(deltaTime, p1);
				paddle2.update(deltaTime, p2);
				// ラリー &　スコア
				const result = ball.update(deltaTime, paddle1, paddle2, gameState,checkPaddleCollision);
				if (result && hud) onScore(result.scorer, ball, paddle1, paddle2, hud, gameState);
			}
		}
    scene.render();
  });
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
	gameState: GameState
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

	countdownAndServe(gameState.lastWinner, ball, paddle1, paddle2, 
									  gameState, hud, settings, UILockController);
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
	hud.showGameOver(winner === 1 ? "Player1" : "Player2");
	if (ball) ball.stop();

	endGameDirection(winner);
	setTimeout(cleanupAndGoHome, 15000);
}

async function endGameDirection(winner: 1 | 2)
{
	if (!scene || !gameStage || !gameStage.camera || !ball)
		return ;

	createWinEffect(scene, winner);
	await cutIn(gameStage.camera, ball.mesh.position);
	const TARGET_RADIUS = 150;
	zoomOut(gameStage.camera, TARGET_RADIUS, 10000);
}

// カットイン
async function cutIn(camera: ArcRotateCamera, ballPosition: Vector3)
{
	const CUT_IN_DELAY = 500;
	const configs = [
		{ alpha: Math.PI / 2, beta: Math.PI / 2.5, radius: 15 },
		{ alpha: camera.alpha, beta: 0.1, radius: 10 },
		{ alpha: Math.PI / 4, beta: Math.PI / 4, radius: 20 },
	];

	for (const config of configs) {
		camera.setTarget(ballPosition.clone());
		camera.alpha = config.alpha;
		camera.beta = config.beta;
		camera.radius = config.radius;
		await delay(CUT_IN_DELAY);
	}
}

// ズームアウト
function zoomOut(camera: ArcRotateCamera, targetRadius: number, duration: number)
{
	const startRadius = camera.radius;
	const startAlpha = camera.alpha;
	const startTime = Date.now();
	const totalRotation = Math.PI * 3; 

	const zoomInterval = setInterval(() => {
		const elapsed = Date.now() - startTime;
		const t = Math.min(1, elapsed / duration);
		const easeOutT = 1 - Math.pow(1 - t, 3);

		camera.setTarget(Vector3.Zero());
		camera.radius = startRadius + (targetRadius - startRadius) * easeOutT;
		camera.alpha = startAlpha + (totalRotation * easeOutT);
		camera.beta = (Math.PI / 5) + (Math.PI / 10 * easeOutT);

		if (t === 1) {
			clearInterval(zoomInterval);
			console.log("Cinematic Zoom-out with Rotation finished.");
		}
	}, 1000 / 60);
}

// 後始末用関数
function cleanupAndGoHome() {
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

	// hudの破棄
	if (hud) {
		if (hud.plane && !hud.plane.isDisposed()) hud.plane.dispose();
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

	if (!isRunning || !scene || scene.isDisposed || gameState.resetLocked ) return;

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
	if (hud) hud.setScore(0, 0);
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
		countdownAndServe("center", ball, paddle1, paddle2, gameState, hud, settings, UILockController);
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
	const gameRoot = document.getElementById("pingpong-3d-root") as HTMLElement | null;
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
export function resumeGame(){
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
