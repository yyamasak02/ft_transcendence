// src/game-main.ts
import {
	ArcRotateCamera,
  HemisphericLight,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
  Color4,
  GlowLayer,
  DirectionalLight,     
  ShadowGenerator,
} from "@babylonjs/core";
import {
	initDOMRefs,
	gameData,
	canvas,
	engine,
	scene,
} from "./core/data";
import {
	BASE_BALL_SPEED,
  WINNING_SCORE,
  setBallSpeed,
  setWinningScore,
	GAME_CONFIG,
} from "./core/constants";
import { setGameState, } from "./core/state";
import {
	toggleUIElements,
	updateCharacterImages,
	preloadCharacterIcons,
} from "./ui/ui";
import { Ball } from "./object/Ball";
import { Paddle, type PaddleInput } from "./object/Paddle";
import { createPaddleMaterial } from "./object/materials/paddleMaterial";
import { checkPaddleCollision, countdownAndServe } from "./utils";

export const gameState = {
	rallyActive: true,
	isServing: false,
	lastWinner: null as 1 | 2 | null,
};

// ============================================
// EventListener
// ============================================

document.addEventListener("keydown", (e) => {
  gameData.keysPressed[e.key] = true;

  if (gameData.gameState === "paused") {
    switch (e.key.toLowerCase()) {
      case "q":
        setBallSpeed(BASE_BALL_SPEED + 1);
        return;
      case "a":
        setBallSpeed(BASE_BALL_SPEED - 1);
        return;
      case "w":
        setWinningScore(WINNING_SCORE + 1);
        return;
      case "s":
        setWinningScore(WINNING_SCORE - 1);
        return;
    }
  }

  if (e.key.toLowerCase() === "p") {
    if (gameData.gameState === "game") {
      setGameState("paused");
    } else if (gameData.gameState === "characterSelect") {
      setGameState("paused");
    } else if (gameData.gameState === "paused") {
      if (gameData.previousGameState === "characterSelect") {
        setGameState("characterSelect");
      } else {
        setGameState("game");
      }
    }
    toggleUIElements();
    return;
  }

  if (e.key === "Enter") {
    if (gameData.gameState === "menu") {
      setGameState("modeSelect");
    } else if (gameData.gameState === "gameover") {
      setGameState("menu");
      gameData.player1.score = 0;
      gameData.player2.score = 0;
      toggleUIElements();
    } else if (gameData.gameState === "paused") {
      setGameState("menu");
      gameData.player1.score = 0;
      gameData.player2.score = 0;
      toggleUIElements();
    }
  }
});

document.addEventListener("keyup", (e) => {
  gameData.keysPressed[e.key] = false;
});

// スマホ用画面のリサイズ
window.addEventListener("resize", () => {
	engine.resize();
});

// ============================================
// start PingPong Game
// ============================================

const { COURT_WIDTH, COURT_HEIGHT, } = GAME_CONFIG;
let ball: Ball | null = null;

export function startPingPongGame() {
  console.log("startPingPongGame 3D called");
  // DOM 初期化（Canvas 取得）
  initDOMRefs();

  // UI 用の画像読み込みなど
  preloadCharacterIcons();
  updateCharacterImages();
  toggleUIElements();

	// score初期化
	gameData.player1.score = 0;
	gameData.player2.score = 0;
	console.log("initial scores", gameData.player1.score, gameData.player2.score);
	updateScoreUI();

  scene.clearColor = new Color4(0.02, 0.02, 0.06, 1.0);

  //-----------------------------------------------------
  // Babylon 3D シーン構築
  //-----------------------------------------------------

  // ===== カメラ =====
  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 5,
    80,
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);

	// ↑↓←→によるカメラの回転を無効化
	camera.keysUp = [];
	camera.keysDown = [];
	camera.keysLeft = [];
	camera.keysRight = [];

	// スマホ向けカメラ制御
	if (window.innerWidth < 768) {
		camera.radius *= 1.8;
		// ズーム固定
		camera.lowerRadiusLimit = camera.radius;
		camera.upperRadiusLimit = camera.radius;
		//　パン無効
		camera.panningSensibility = 0;
		// スワイプで動かない(回転しない)
		camera.angularSensibilityX = 9000;
		camera.angularSensibilityY = 9000;
	}
	
  // ===== ライト =====
  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // ===== GlowLayer（発光エフェクト） =====
  const glow = new GlowLayer("glow", scene);
  glow.intensity = 0.25;

  // ===== コート（床） =====
  const court = MeshBuilder.CreateGround(
    "court",
    { width: COURT_WIDTH, height: COURT_HEIGHT },
    scene
  );
  const courtMat = new StandardMaterial("courtMat", scene);
  courtMat.diffuseColor = new Color3(0.0, 0.05, 0.2);  // 濃い青
  courtMat.emissiveColor = new Color3(0.0, 0.2, 0.7); // 軽い自発光
  court.material = courtMat;
  court.position = new Vector3(0, 0, 0);

  // ===== Player1 =====
	const paddle1 = new Paddle(scene, new Vector3(COURT_WIDTH / 2 - 1, 1, 0));
	paddle1.mesh.material = createPaddleMaterial("p1", scene);
  // ===== player2 =====
	const paddle2 = new Paddle(scene, new Vector3(-(COURT_WIDTH / 2 - 1), 1, 0));
	paddle2.mesh.material = createPaddleMaterial("p2", scene);

  // ===== ボール （Sphere + TrailMesh） =====
	const initialBallPos = new Vector3(0, 1, 0);
	const gameBall = new Ball(scene, initialBallPos);
	ball = gameBall;
	gameBall.reset("center", paddle1, paddle2);
	setTimeout(() => {
		countdownAndServe("center", gameBall, paddle1, paddle2, gameState);
	}, 0);

  //-----------------------------------------------------
  // Babylon の描画ループ開始
  //-----------------------------------------------------
  engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();
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

  // ===== 影用のライト =====
  const dirLight = new DirectionalLight(
    "dirLight",
    new Vector3(-0.5, -1, -0.3), // 斜め前から当てるイメージ
    scene
  );
  dirLight.position = new Vector3(0, 20, 20); // 上の方から

  // ===== ShadowGenerator =====
  const shadowGen = new ShadowGenerator(1024, dirLight);

  // 影のクオリティ調整（ふんわり影）
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 32;

  // 影を「落とす」メッシュ
  shadowGen.addShadowCaster(paddle1.mesh);
  shadowGen.addShadowCaster(paddle2.mesh);
  shadowGen.addShadowCaster(ball.mesh);

  // 影を「受ける」メッシュ
  court.receiveShadows = true;

  console.log("Babylon 3D PONG initialized");
}

// score
function updateScoreUI() {
	const el = document.getElementById("score");
	if (!el) return;
	el.textContent = `${gameData.player1.score} - ${gameData.player2.score}`;
}
