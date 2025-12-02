// src/game-main.ts
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
let ball: Ball | null = null;
let isRunning = false;
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
	if (!hud) hud = new GameHUD(scene);
	setupKeyboardListener();
	
	gameState.phase = "game";
	gameState.rallyActive = false;
	gameData.player1.score = 0;
	gameData.player2.score = 0;
	
  scene.clearColor = new Color4(0.02, 0.02, 0.06, 1.0);

  // Player
	const paddle1 = new Paddle(scene, new Vector3(COURT_WIDTH / 2 - 1, 1, 0));
	paddle1.mesh.material = createPaddleMaterial("p1", scene);
	const paddle2 = new Paddle(scene, new Vector3(-(COURT_WIDTH / 2 - 1), 1, 0));
	paddle2.mesh.material = createPaddleMaterial("p2", scene);

	// Ball
	const initialBallPos = new Vector3(0, 1, 0);
	const gameBall = new Ball(scene, initialBallPos);
	ball = gameBall;
	gameBall.stop();
	gameBall.reset("center", paddle1, paddle2);
	setTimeout(() => {
		if (hud) countdownAndServe("center", gameBall, paddle1, paddle2, gameState, hud);
	}, 0);
	
	// Stage
	const stage = new Stage(scene, canvas, paddle1, paddle2, ball);
	
	// Display
	hud.setScore(gameData.player1.score, gameData.player2.score);

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
				const result = ball.update(deltaTime, paddle1, paddle2, gameState,
																	 (ballMesh, paddle) => checkPaddleCollision(ballMesh,
																	 paddle));
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
	console.log("soptPingPongGame called");
	if (!isRunning) return;
	if (hud) {
		hud.plane.dispose();
		hud = null;
	}

	isRunning = false;
	if (engine) engine.stopRenderLoop();
	if (scene && !scene.isDisposed) scene.dispose();
	ball = null;
}
