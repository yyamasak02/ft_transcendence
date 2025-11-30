// src/game-main.ts
import { Vector3, Color4, } from "@babylonjs/core";
import {
	initDOMRefs,
	gameData,
	canvas,
	engine,
	scene,
} from "./core/data";
import { GAME_CONFIG,} from "./core/constants";
import {
	toggleUIElements,
	updateCharacterImages,
	preloadCharacterIcons,
} from "./ui/ui";
import { Ball } from "./object/Ball";
import { Paddle, type PaddleInput } from "./object/Paddle";
import { Stage } from "./object/Stage";
import { createPaddleMaterial } from "./object/materials/paddleMaterial";
import { checkPaddleCollision, countdownAndServe } from "./object/ballPaddleUtils";
import { setupKeyboardListener } from "./input/keyboard";

export const gameState = {
	rallyActive: true,
	isServing: false,
	lastWinner: null as 1 | 2 | null,
};

const { COURT_WIDTH } = GAME_CONFIG;
let ball: Ball | null = null;

// ============================================
// start PingPong Game
// ============================================

export function startPingPongGame() {
  console.log("startPingPongGame 3D called");
	setupKeyboardListener();

  //===== 初期化 =========================================

	// Canvas 取得
  initDOMRefs();
  // UI 用の画像読み込みなど
  preloadCharacterIcons();
  updateCharacterImages();
  toggleUIElements();
	// score初期化
	gameData.player1.score = 0;
	gameData.player2.score = 0;
	updateScoreUI();
  scene.clearColor = new Color4(0.02, 0.02, 0.06, 1.0);

	// ===== シーン構築 ====================================

  // Player
	const paddle1 = new Paddle(scene, new Vector3(COURT_WIDTH / 2 - 1, 1, 0));
	paddle1.mesh.material = createPaddleMaterial("p1", scene);
	const paddle2 = new Paddle(scene, new Vector3(-(COURT_WIDTH / 2 - 1), 1, 0));
	paddle2.mesh.material = createPaddleMaterial("p2", scene);

	// Ball
	const initialBallPos = new Vector3(0, 1, 0);
	const gameBall = new Ball(scene, initialBallPos);
	ball = gameBall;
	gameBall.reset("center", paddle1, paddle2);
	setTimeout(() => {
		countdownAndServe("center", gameBall, paddle1, paddle2, gameState);
	}, 0);

	// Stage
	const stage = new Stage(scene, canvas, paddle1, paddle2, ball);

  // ===== Babylon の描画ループ開始 ========================

	engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();
		
		// paddleの動き
		if (paddle1 && paddle2) {
			const p1Input: PaddleInput = {
				up: gameData.keysPressed["w"],
				down: gameData.keysPressed["s"],
			};
			const p2Input: PaddleInput = {
				up: gameData.keysPressed["ArrowUp"],
				down: gameData.keysPressed["ArrowDown"],
			};
			paddle1.update(deltaTime, p1Input);
			paddle2.update(deltaTime, p2Input);
		}

		// 衝突判定 &　スコア
		if (ball && paddle1 && paddle2) {
			const result = ball.update(deltaTime, paddle1, paddle2, gameState,
																 (ballMesh, paddle) => checkPaddleCollision(ballMesh, paddle));
			if (result) {
				const score = result.scorer;
				if (score === 1) {
						gameData.player1.score++;
						gameState.rallyActive = false;
						updateScoreUI();
						countdownAndServe(1, ball, paddle1, paddle2, gameState);
				} else {
					gameData.player2.score += 1;
					gameState.rallyActive = false;
					updateScoreUI();
					countdownAndServe(2, ball, paddle1, paddle2, gameState);
				}
			}
		}

    scene.render();
  });
  console.log("Babylon 3D PONG initialized");
}

// score
function updateScoreUI() {
	const el = document.getElementById("score");
	if (!el) return;
	el.textContent = `${gameData.player1.score} - ${gameData.player2.score}`;
}
