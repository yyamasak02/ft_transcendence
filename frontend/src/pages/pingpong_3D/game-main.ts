// src/game-main.ts　ゲーム本体

import { Vector3, Color4 } from "@babylonjs/core";
import { initDOMRefs, gameData, canvas, engine, scene } from "./core/data";
import { GAME_CONFIG } from "./core/constants3D";
import { Ball } from "./object/Ball";
import { Paddle } from "./object/Paddle";
import { Stage } from "./object/Stage";
import { createPaddleMaterial } from "./object/materials/paddleMaterial";
import { checkPaddleCollision, countdownAndServe } from "./object/ballPaddleUtils";
import { setupKeyboardListener, getPaddleInputs } from "./input/keyboard";
import { GameHUD } from "./object/ui3D/GameHUD";
import { navigate } from "@/router/router";
import { handleScoreAndRally } from "./object/ballPaddleUtils";
import type { GameState } from "./types/game";

const { COURT_WIDTH } = GAME_CONFIG;
let isRunning = false;
let isPaused = false;
let ball: Ball | null = null;
let hud: GameHUD | null = null;

export const gameState: GameState = {
	phase: "menu",
	rallyActive: true,
	isServing: false,
	lastWinner: null,
};

// ============================================
// ゲーム本体
// ============================================

export function startPingPongGame() {
	if (isRunning) {
		console.log("startPingPongGame called but game is already running");
		return;
	}

	isRunning = true;
  initDOMRefs();
	const canvasEl = document.getElementById("gameCanvas3D");
	if (canvasEl) {
		canvasEl.addEventListener("click", () => {
			console.log("canvas clicked!");
		});
	}
	if (!hud) hud = new GameHUD(scene);
	setupKeyboardListener();
	
	gameState.phase = "game";
	gameState.rallyActive = false;
	gameData.paddles.player1.score = 0;
	gameData.paddles.player2.score = 0;
	
  scene.clearColor = new Color4(0, 0, 0, 0.5);

  // Player1
	const p1Length = gameData.paddles.player1.length;
	const p1Color = gameData.paddles.player1.color;
	const paddle1 = new Paddle(scene, new Vector3(COURT_WIDTH / 2 - 1, 1, 0), p1Length);
	paddle1.mesh.material = createPaddleMaterial("p1", p1Color, scene);
  // Player2
	const p2Length = gameData.paddles.player2.length;
	const p2Color = gameData.paddles.player2.color;
	const paddle2 = new Paddle(scene, new Vector3(-(COURT_WIDTH / 2 - 1), 1, 0), p2Length);
	paddle2.mesh.material = createPaddleMaterial("p2", p2Color, scene);

	// Ball
	const initialBallPos = new Vector3(0, 1, 0);
	const gameBall = new Ball(scene, initialBallPos);
	ball = gameBall;
	gameBall.stop();
	gameBall.velocity = new Vector3(0, 0, 0);
	gameBall.reset("center", paddle1, paddle2);
	setTimeout(() => {
		if (hud) countdownAndServe("center", gameBall, paddle1, paddle2, gameState, hud);
	}, 0);
	
	// Stage
	new Stage(scene, canvas, paddle1, paddle2, ball);
	
	// Display
	hud.setScore(gameData.paddles.player1.score, gameData.paddles.player2.score);

  // ===== 描画ループ開始 ========================

	engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();
		
		if (paddle1 && paddle2 && ball) {
			if (gameState.phase === "game") {
				// paddleの動き
				const { p1, p2 } = getPaddleInputs();
				paddle1.update(deltaTime, p1);
				paddle2.update(deltaTime, p2);
				// ラリー &　スコア
				const result = ball.update(deltaTime, paddle1, paddle2, gameState,checkPaddleCollision);
				if (hud) handleScoreAndRally(result, ball, paddle1, paddle2, gameState, hud, endGame);
			}
		}
    scene.render();
  });
}


// ============================================
// 内部実装部
// ============================================

// ゲーム終了
export function endGame(hub: GameHUD, winner: 1 | 2) {
	console.log("Game Over");
	gameState.phase = "gameover";
	hub.showGameOver(winner === 1 ? "Player1" : "Player2");
	if (ball) ball.stop();
	engine.stopRenderLoop();
	setTimeout(() => {
		if (scene && !scene.isDisposed) scene.dispose();
		if (engine) engine.dispose();
		navigate("/pingpong_3D_config");
	}, 3000);
}

//　ゲーム強制終了処理
export function stopPingPongGame() {
	console.log("stopPingPongGame called");
	if (!isRunning) return;

	isRunning = false;
	if (hud) {
		if (hud.plane && !hud.plane.isDisposed()) hud.plane.dispose();
		hud = null;
	}
	if (ball) {
		ball.stop();
		ball = null;
	}
	if (scene && !scene.isDisposed) scene.dispose();
	if (engine) {
		engine.stopRenderLoop();
		engine.dispose();
	}
	ball = null;
}

export function resetGame() {

}

export function pauseGame() {

}

export function resumeGame(){

}
