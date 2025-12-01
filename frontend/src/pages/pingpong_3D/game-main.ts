// src/game-main.ts
import { Vector3, Color4, } from "@babylonjs/core";
import { initDOMRefs, gameData, canvas, engine, scene,} from "./core/data";
import { GAME_CONFIG,} from "./core/constants";
import { toggleUIElements, updateCharacterImages, preloadCharacterIcons, } from "./ui/ui";
import { Ball } from "./object/Ball";
import { Paddle, type PaddleInput } from "./object/Paddle";
import { Stage } from "./object/Stage";
import { createPaddleMaterial } from "./object/materials/paddleMaterial";
import { checkPaddleCollision, countdownAndServe } from "./object/ballPaddleUtils";
import { setupKeyboardListener } from "./input/keyboard";
import { GameHUD } from "./object/ui3D/GameHUD";
import { WINNING_SCORE } from "../pingpong/core/constants";
import { navigate } from "@/router/router";

export const gameState = {
	phase: "menu" as "menu" | "game" | "gameover" | "pause",
	rallyActive: true,
	isServing: false,
	lastWinner: null as 1 | 2 | null,
};

const { COURT_WIDTH } = GAME_CONFIG;
let ball: Ball | null = null;

// ============================================
// ゲーム本体
// ============================================

export function startPingPongGame() {
  console.log("startPingPongGame 3D called");
	setupKeyboardListener();

  initDOMRefs();
  // preloadCharacterIcons();
  // updateCharacterImages();
  // toggleUIElements();
	
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
		
		// paddleの動き
		if (paddle1 && paddle2 && ball) {
			const p1Input: PaddleInput = {
				up: gameData.keysPressed["w"],
				down: gameData.keysPressed["s"],
			};
			const p2Input: PaddleInput = {
				up: gameData.keysPressed["ArrowUp"],
				down: gameData.keysPressed["ArrowDown"],
			};
			if (gameState.phase === "game") {
				paddle2.update(deltaTime, p2Input);
				paddle1.update(deltaTime, p1Input);
				// 衝突判定 &　スコア
				const result = ball.update(deltaTime, paddle1, paddle2, gameState,
					(ballMesh, paddle) => checkPaddleCollision(ballMesh, paddle));
				if (result) {
					const score = result.scorer;
					if (score === 1) {
						gameData.player1.score++;
						gameState.rallyActive = false;
						gameState.lastWinner = 1;
						gameState.rallyActive = true;
						hud.setScore(gameData.player1.score, gameData.player2.score);
						if (gameData.player1.score >= WINNING_SCORE) {
							endGame(hud, 1);
							return;
						}
						countdownAndServe(1, ball, paddle1, paddle2, gameState, hud);
					} else {
						gameData.player2.score += 1;
						gameState.rallyActive = false;
						gameState.lastWinner = 2;
						gameState.rallyActive = true;
						hud.setScore(gameData.player1.score, gameData.player2.score);
						if (gameData.player2.score >= WINNING_SCORE) {
							endGame(hud, 2);
							return;
						}
						countdownAndServe(2, ball, paddle1, paddle2, gameState, hud);
					}
				}
			}
		}

    scene.render();
  });
	
  console.log("Babylon 3D PONG initialized");
}

function endGame(hub: GameHUD, winner: 1 | 2) {
	console.log("Game Over");
	gameState.phase = "gameover";
	hub.showGameOver(winner === 1 ? "Player1" : "Player2");
	if (ball) ball.stop();
	setTimeout(() => {
		navigate("/pingpong_3D_config");
	}, 3000);
}
