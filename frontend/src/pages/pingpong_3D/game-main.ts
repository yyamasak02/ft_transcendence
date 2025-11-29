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
} from "@babylonjs/core";
import {
  toggleUIElements,
  updateCharacterImages,
  preloadCharacterIcons,
} from "./ui/ui";
import {
  setGameState,
} from "./core/state";
import {
  BASE_BALL_SPEED,
  WINNING_SCORE,
  setBallSpeed,
  setWinningScore,
} from "./core/constants";

let lastWinner: 1 | 2 | null = null;

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

////// 各種 define ///////////////

const COURT_WIDTH = 60;  // 横（2D の canvas.width に相当）
const COURT_HEIGHT = 40; // 縦（2D の canvas.height に相当）

const PADDLE_LENGTH = 8;
const PADDLE_THICKNESS = 1;
const BALL_RADIUS = 1;

let paddle1: Mesh | null = null;
let paddle2: Mesh | null = null;

let ballMesh: Mesh | null = null;
let ballVelocity = new Vector3(0.15, 0, 0.25);

let rallyActive = true; // ラリー中true
let isServing = false; // サーブ準備中かどうか

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

  // ===== ボール C（Sphere + TrailMesh） =====
  ballMesh = MeshBuilder.CreateSphere(
    "ball",
    { diameter: 2 },
    scene
  );
  ballMesh.position = new Vector3(0, 1, 0);

	resetBall("center");
	setTimeout(() => {
		countdownAndServe("center");
	}, 0);

  //-----------------------------------------------------
  // Babylon の描画ループ開始
  //-----------------------------------------------------
  engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime();

    updatePaddles(deltaTime, paddle1, paddle2);
    updateBall(deltaTime);
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
  shadowGen.addShadowCaster(ballMesh);

  // 影を「受ける」メッシュ
  court.receiveShadows = true;

  console.log("Babylon 3D PONG initialized");
}

//////// ここから動きを制御するための関数群 ////////

// ballの反射の動きを作る
function updateBall(deltaTime: number) {
  if (!ballMesh || !paddle1 || !paddle2) return;

	// カウントダウン中はパドルに追従
	if (isServing) {
		console.log("追従中:", lastWinner, ballMesh.position);
		if (lastWinner === 1) {
			ballMesh.position.x = paddle1.position.x - 1.5;
			ballMesh.position.z = paddle1.position.z;
		} else if (lastWinner === 2) {
			ballMesh.position.x = paddle2.position.x + 1.5;
			ballMesh.position.z = paddle2.position.z;
		}
		return;
	}

  const dt = deltaTime * 0.03;

  ballMesh.position.x += ballVelocity.x * dt;
  ballMesh.position.z += ballVelocity.z * dt;

	// paddleで反射
  // paddle1
  if (checkPaddleCollision(ballMesh, paddle1)) {
		reflectBall(ballMesh, paddle1, false);
  }
  // paddle2
  if (checkPaddleCollision(ballMesh, paddle2)) {
		reflectBall(ballMesh, paddle2, true);
  }
  
	// 壁で反射
  // const halfWidth = COURT_WIDTH / 2;
  const halfHeight = COURT_HEIGHT / 2;
  const margin = 1.0;
  
  if (ballMesh.position.z > halfHeight - margin) {
    ballMesh.position.z = halfHeight - margin;
    ballVelocity.z *= -1;
  }
  if (ballMesh.position.z < -halfHeight + margin) {
    ballMesh.position.z = -halfHeight + margin;
    ballVelocity.z *= -1;
  }

	// 得点判定
	const halfWidth = COURT_WIDTH / 2;
	if (!rallyActive) return;
	//  p2得点 p2サーブ
	if (ballMesh.position.x > halfWidth + 1) {
		gameData.player2.score++;
		rallyActive = false;
		updateScoreUI();
		countdownAndServe(2);
		return;
	}
	//  p1得点 p1サーブ
	if (ballMesh.position.x < -halfWidth - 1) {
		gameData.player1.score += 1;
		rallyActive = false;
		updateScoreUI();
		countdownAndServe(1);
		return;
	}
}

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

// ballとpaddleの衝突角度によって反射の強さを変える
function reflectBall(ball: Mesh, paddle: Mesh, isLeftPaddle: boolean) {
	// paddleの中心からどれだけ離れているか
	const offsetZ = (ball.position.z - paddle.position.z) / (PADDLE_LENGTH / 2);
	const hitCenterRate = 1 - Math.min(Math.abs(offsetZ), 1);

	// z方向(上下)の速度に反映
	ballVelocity.z = offsetZ * 0.6; // TODO 0.6を後で調整
	// x方向(左右)の反転方向を決める
	if (isLeftPaddle) {
		ballVelocity.x = Math.abs(ballVelocity.x);
		ball.position.x = paddle.position.x + (PADDLE_THICKNESS / 2 + BALL_RADIUS + 0.1);
	} else {
		ballVelocity.x = -Math.abs(ballVelocity.x);
		ball.position.x = paddle.position.x - (PADDLE_THICKNESS / 2 + BALL_RADIUS + 0.1);
	}
	
	// スピードの変化をつける
	const baseSpeedUp = 1.02;
	const extraSpeedUp = 0.10;
	const speedUp = baseSpeedUp + extraSpeedUp * hitCenterRate;

	const maxSpeed = 1.5;
	ballVelocity.x *= speedUp;
	ballVelocity.z *= speedUp;
	const currentSpeed = Math.sqrt(ballVelocity.x ** 2 + ballVelocity.z ** 2);
	
	if (currentSpeed > maxSpeed) {
		const scale = maxSpeed / currentSpeed;
		ballVelocity.x *= scale;
		ballVelocity.z *= scale;
	}
}

// プレイ開始時のball positionと射出角度
function resetBall(startFrom: 1 | 2 | "center") {
	if (!ballMesh || !paddle1 || !paddle2) {
		console.warn("resetBall called before beshes are ready");
		return;
	}

	// ball position
	if (startFrom === "center") {
		ballMesh.position = new Vector3(0, 1, 0);
	} else if (startFrom === 1) {
		// paddle1から
		ballMesh.position = new Vector3(30, 1, paddle1.position.z);
	} else if (startFrom === 2) {
		// paddle2から
		ballMesh.position = new Vector3(-30, 1, paddle2.position.z);
	}
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
	if (!el) return;

	if (startFrom === 1 || startFrom === 2) lastWinner = startFrom;
	isServing = true;
	rallyActive = false;

	ballVelocity = new Vector3(0, 0, 0); // ball停止
	
	resetBall(startFrom);
	el.textContent = "3";
	await delay(800);
	el.textContent = "2";
	await delay(800);
	el.textContent = "1";
	await delay(800);
	el.textContent = "";

	ballVelocity = randomServeVelocity(startFrom);
	
	isServing = false;
	rallyActive = true;
}

// countdownに使用
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
