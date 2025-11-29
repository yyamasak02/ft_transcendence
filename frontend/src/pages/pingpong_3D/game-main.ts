// src/game-main.ts

import {
  initDOMRefs,
  gameData,
  canvas,
  engine,
  scene,
} from "./core/data";
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
  Mesh,
	Scene,  
} from "@babylonjs/core";
import {
  toggleUIElements,
  updateCharacterImages,
  preloadCharacterIcons,
} from "./ui/ui";
import { setGameState, } from "./core/state";
import {
  BASE_BALL_SPEED,
  WINNING_SCORE,
  setBallSpeed,
  setWinningScore,
} from "./core/constants";
import { Ball } from "./object/Ball";
import { GAME_CONFIG } from "./core/constants";

export const gameState = {
	rallyActive: true,
	isServing: false,
	lastWinner: null as 1 | 2 | null,
};

////// 各種 define ///////////////

const {
	COURT_WIDTH,
  COURT_HEIGHT,
  PADDLE_LENGTH,
  PADDLE_THICKNESS,
  BALL_RADIUS,
} = GAME_CONFIG;

let paddle1: Mesh | null = null;
let paddle2: Mesh | null = null;
let ball: Ball | null = null;

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

////// 3D Game 心臓部 //////////////
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

  const paddleY = 0.7;

  // ===== Player1 =====
  paddle1 = MeshBuilder.CreateCylinder(
    "paddle1",
    {
      height: PADDLE_LENGTH,
      diameter: PADDLE_THICKNESS,
    },
    scene
  );
  paddle1.position = new Vector3(29, paddleY, 0);

  const p1Mat = new StandardMaterial("p1Mat", scene);
  p1Mat.diffuseColor = new Color3(0.1, 0.6, 1.0);
  p1Mat.emissiveColor = new Color3(0.1, 0.7, 1.3);
  paddle1.material = p1Mat;
  paddle1.rotation.x = Math.PI / 2;

  // ===== player2 =====
  paddle2 = paddle1.clone("paddle2");
  paddle2.position = new Vector3(-29, paddleY, 0);

  const p2Mat = new StandardMaterial("p2Mat", scene) ;
  p2Mat.diffuseColor = new Color3(1.0, 0.4, 0.4);
  p2Mat.emissiveColor = new Color3(1.3, 0.4, 0.4);
  paddle2.material = p2Mat;

  // ===== ボール （Sphere + TrailMesh） =====
	const initialBallPos = new Vector3(0, 1, 0);
	ball = new Ball(scene, initialBallPos);

	ball.reset("center", paddle1, paddle2);
	setTimeout(() => {
		countdownAndServe("center");
	}, 0);

  //-----------------------------------------------------
  // Babylon の描画ループ開始
  //-----------------------------------------------------
  engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();
		if (ball && paddle1 && paddle2) {
			const result = ball.update(deltaTime, paddle1, paddle2, gameState, checkPaddleCollision);
			if (result) {
				const score = result.scorer;
				if (score === 1) {
						gameData.player1.score++;
						gameState.rallyActive = false;
						updateScoreUI();
						countdownAndServe(1);
				} else {
					gameData.player2.score += 1;
					gameState.rallyActive = false;
					updateScoreUI();
					countdownAndServe(2);
				}
			}
		}
    updatePaddles(deltaTime, paddle1, paddle2);
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
  shadowGen.addShadowCaster(paddle1);
  shadowGen.addShadowCaster(paddle2);
  shadowGen.addShadowCaster(ball.mesh);

  // 影を「受ける」メッシュ
  court.receiveShadows = true;

  console.log("Babylon 3D PONG initialized");
}

//////// ここから動きを制御するための関数群 ////////

// スマホ用画面のリサイズ
window.addEventListener("resize", () => {
	engine.resize();
});

// paddle の動き制御
function updatePaddles(deltaTime: number, paddle1: any, paddle2: any) {
  const speed = 0.05 * deltaTime; // paddle 速度
	
	// Player 1（w/s key）
	if (gameData.keysPressed["w"]) paddle1.position.z -= speed;
	if (gameData.keysPressed["s"]) paddle1.position.z += speed;
  // Player2 (up/down key)
  if (gameData.keysPressed["ArrowUp"]) paddle2.position.z -= speed;
  if (gameData.keysPressed["ArrowDown"]) paddle2.position.z += speed;

  const halfHeight = COURT_HEIGHT / 2;
  const margin = 2;

  // player1 上限下限
  if (paddle1.position.z < -halfHeight + margin) paddle1.position.z = -halfHeight + margin;
  if (paddle1.position.z > halfHeight - margin) paddle1.position.z = halfHeight - margin;
  // player2 上限下限
  if (paddle2.position.z < -halfHeight + margin) paddle2.position.z = -halfHeight + margin;
  if (paddle2.position.z > halfHeight - margin) paddle2.position.z = halfHeight - margin;
}

// ballとpaddleの衝突判定
function checkPaddleCollision(ball: Mesh, paddle: Mesh): boolean {
	const r = BALL_RADIUS;
	const bx = ball.position.x;
	const bz = ball.position.z;
	const px = paddle.position.x;
	const pz = paddle.position.z;
	const halfL = PADDLE_LENGTH / 2;
	const halfT = PADDLE_THICKNESS / 2;

	// paddleの座標
	const minX = px - halfT;
	const maxX = px + halfT;
	const minZ = pz - halfL;
	const maxZ = pz + halfL;
	// 最も近い点
	const nearestX = Math.max(minX, Math.min(bx, maxX));
	const nearestZ = Math.max(minZ, Math.min(bz, maxZ));
	// 距離
	const dx = bx - nearestX;
	const dz = bz - nearestZ;

	return dx ** 2  + dz ** 2 <= r ** 2;
}



// random angle生成
function randomServeVelocity(startFrom: "center" | 1 | 2): Vector3 {
	const speed = 0.8; // 初速

	let dirX: number;

	if (startFrom === 1) dirX = -1;
	else if (startFrom === 2) dirX = 1;
	else dirX = Math.random() > 0.5 ? 1 : -1;

	if (startFrom === "center") return new Vector3(dirX * speed, 0, 0);

	// 2回目以降は角度をつける
	const minAngle = Math.PI / 12;
	const maxAngle = Math.PI / 4;
	const angle = (Math.random() * (maxAngle - minAngle) + minAngle)
								* (Math.random() > 0.5 ? 1 : -1);

	const x = dirX * Math.cos(angle);
	const z = Math.sin(angle);
	const dir = new Vector3(x, 0, z);

	return dir.scale(speed);
}

// score
function updateScoreUI() {
	const el = document.getElementById("score");
	if (!el) return;
	el.textContent = `${gameData.player1.score} - ${gameData.player2.score}`;
}

// countdown
async function countdownAndServe(startFrom: "center" | 1 | 2) {
	const el = document.getElementById("countdown");
	if (!el || !ball || !paddle1 || !paddle2) return;

	if (startFrom === 1 || startFrom === 2) gameState.lastWinner = startFrom;
	gameState.isServing = true;
	gameState.rallyActive = false;

	ball.stop(); // ball停止
	ball.reset(startFrom, paddle1, paddle2);

	el.textContent = "3";
	await delay(800);
	el.textContent = "2";
	await delay(800);
	el.textContent = "1";
	await delay(800);
	el.textContent = "";

	ball.velocity = randomServeVelocity(startFrom);
	
	gameState.isServing = false;
	gameState.rallyActive = true;
}

// countdownに使用
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
