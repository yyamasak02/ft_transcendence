// src/game-main.ts
import { Vector3, Color4 } from "@babylonjs/core";
import { initDOMRefs, gameData, canvas, engine, scene } from "./core/data";
import { GAME_CONFIG,} from "./core/constants";
import { Ball } from "./object/Ball";
import { Paddle } from "./object/Paddle";
import { Stage } from "./object/Stage";
import { createPaddleMaterial } from "./object/materials/paddleMaterial";
import { checkPaddleCollision, countdownAndServe } from "./object/ballPaddleUtils";
import { setupKeyboardListener, getPaddleInputs } from "./input/keyboard";
import { GameHUD } from "./object/ui3D/GameHUD";
import { WINNING_SCORE } from "../pingpong/core/constants";
import { navigate } from "@/router/router";

export const gameState = {
	phase: "menu" as "menu" | "game" | "gameover" | "pause",
	rallyActive: true,
	isServing: false,
	lastWinner: null as 1 | 2 | null,
};
export type ScoreResult = { scorer: 1 | 2 } | null;

const { COURT_WIDTH } = GAME_CONFIG;
let ball: Ball | null = null;

// ============================================
// ゲーム本体
// ============================================

export function startPingPongGame() {
  console.log("startPingPongGame 3D called");
	setupKeyboardListener();
  initDOMRefs();
	
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
		countdownAndServe("center", gameBall, paddle1, paddle2, gameState, hud);
	}, 0);
	
	// Stage
	const stage = new Stage(scene, canvas, paddle1, paddle2, ball);
	
	// Display
	const hud = new GameHUD(scene);
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
				handleScoreAndRally(result, ball, paddle1, paddle2, hud);
			}
		}
    scene.render();
  });
}

// ============================================
// 内部実装部
// ============================================

// ラリー & スコア
function handleScoreAndRally(
	result: ScoreResult,
	ball: Ball,
	paddle1: Paddle,
	paddle2: Paddle,
	// gameState: typeof GameState,
	hud: GameHUD,
): void {
	if (!result) return;
	
	const scorer = result.scorer;
	// ラリー停止
	gameState.rallyActive = false;
	
	// スコア更新
	if (scorer === 1) {
		gameData.player1.score++;
		gameState.rallyActive = false;
		gameState.lastWinner = 1;
	} else {
		gameData.player2.score++;
		gameState.rallyActive = false;
		gameState.lastWinner = 2;
	}
	hud.setScore(gameData.player1.score, gameData.player2.score);
	
	// ゲーム終了判定
	if (gameData.player1.score >= WINNING_SCORE) {
		endGame(hud, 1);
		return;
	}
	if (gameData.player2.score >= WINNING_SCORE) {
		endGame(hud, 2);
		return;
	}
	
	// 次のサーブ
	countdownAndServe(scorer, ball, paddle1, paddle2, gameState, hud);
}

// ゲーム終了
function endGame(hub: GameHUD, winner: 1 | 2) {
	console.log("Game Over");
	gameState.phase = "gameover";
	hub.showGameOver(winner === 1 ? "Player1" : "Player2");
	if (ball) ball.stop();
	engine.stopRenderLoop();
	scene.dispose();
	engine.dispose();
	setTimeout(() => {
		navigate("/pingpong_3D_config");
	}, 3000);
}
