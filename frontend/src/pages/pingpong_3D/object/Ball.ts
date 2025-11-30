// pingpong_3D/object/Ball.ts
import { Mesh, MeshBuilder, Vector3, Scene } from "@babylonjs/core";
import { GAME_CONFIG } from "../core/constants"; 
import { Paddle } from "./Paddle"
import { createBallMaterial } from "./materials/ballMaterial";

const {
	COURT_WIDTH,
  COURT_HEIGHT,
  PADDLE_LENGTH,
  PADDLE_THICKNESS,
  BALL_RADIUS,
} = GAME_CONFIG;

export type GameState = {
	rallyActive: boolean;
	isServing: boolean;
	lastWinner: 1 | 2 | null;
}

export type ScoreResult = { scorer: 1 | 2 } | null;

// ============================================
// Ball クラス
// ============================================
export class Ball {
	mesh: Mesh;
	velocity: Vector3;

	constructor(scene: Scene, initialPosition: Vector3) {
		this.mesh = MeshBuilder.CreateSphere("ball", { diameter: 2 }, scene);
		this.mesh.visibility = 0;
		this.mesh.position.copyFrom(initialPosition);
		this.velocity = new Vector3(0.15, 0, 0.25);
		this.mesh.material = createBallMaterial(scene);
	}

	appear() { this.mesh.visibility = 1; }

	stop() { this.velocity.set(0, 0, 0); }
	
	// ballの反射の動きを作る
	update(
		deltaTime: number,
		paddle1: Paddle, 
		paddle2: Paddle,
		gameState: GameState,
		checkPaddleCollision: (ballMesh: Mesh, paddleMesh: Mesh) => boolean
		): ScoreResult { 
		return updateBallImp(this, deltaTime, paddle1, paddle2, gameState, checkPaddleCollision); 
	}
	
	// ballとpaddleの衝突角度によって反射の強さを変える
	reflect(paddle: Paddle, isLeftPaddle: boolean) { reflectBallImp(this, paddle, isLeftPaddle); }
	
	// プレイ開始時のball positionと射出角度
	reset(startFrom: 1 | 2 | "center", paddle1: Paddle, paddle2: Paddle) { resetBallImp(this, startFrom, paddle1, paddle2); }
}

// ============================================
// 内部実装部
// ============================================

// ballの更新処理 ///////////////////////////////
function updateBallImp(
	ball: Ball,
	deltaTime:number,
	paddle1: Paddle,
	paddle2: Paddle,
	gameState: GameState,
	checkPaddleCollision: (ballMesh: Mesh, paddleMesh: Mesh) => boolean
): ScoreResult {
	console.log("update ball called");
	if (!ball || !paddle1 || !paddle2) return null;

	// カウントダウン中はパドルに追従
	const pos = PADDLE_THICKNESS / 2 + BALL_RADIUS;
	if (gameState.isServing) {
		if (gameState.lastWinner === 1) {
			ball.mesh.position.x = paddle1.mesh.position.x - pos;
			ball.mesh.position.z = paddle1.mesh.position.z;
		} else if (gameState.lastWinner === 2) {
			ball.mesh.position.x = paddle2.mesh.position.x + pos;
			ball.mesh.position.z = paddle2.mesh.position.z;
		}
		return null;
	}

	// 移動処理
	const dt = deltaTime * 0.03;
	ball.mesh.position.x += ball.velocity.x * dt;
	ball.mesh.position.z += ball.velocity.z * dt;
	// paddle1衝突
	if (checkPaddleCollision(ball.mesh, paddle1.mesh)) { ball.reflect(paddle1, false);}
	// paddle2衝突
	if (checkPaddleCollision(ball.mesh, paddle2.mesh)) { ball.reflect(paddle2, true); }
	
	// 壁で反射
	const halfHeight = COURT_HEIGHT / 2;
	const margin = 1.0;
	if (ball.mesh.position.z > halfHeight - margin) {
		ball.mesh.position.z = halfHeight - margin;
		ball.velocity.z *= -1;
	}
	if (ball.mesh.position.z < -halfHeight + margin) {
		ball.mesh.position.z = -halfHeight + margin;
		ball.velocity.z *= -1;
	}

	// 得点判定
	const halfWidth = COURT_WIDTH / 2;
	if (ball.mesh.position.x > halfWidth + 1) return { scorer: 2 };
	if (ball.mesh.position.x < -halfWidth - 1) return { scorer: 1};
	console.log("update ball done");
	return null;
}

// ballとpaddleの衝突角度によって反射の強さを変える /////////////////
function reflectBallImp(ball: Ball, paddle: Paddle, isLeftPaddle: boolean) {
	console.log("reflect ball called");
	const mesh = ball.mesh;
	const vel	 = ball.velocity;
	
	// paddleの中心からどれだけ離れているか
	const offsetZ = (mesh.position.z - paddle.mesh.position.z) / (PADDLE_LENGTH / 2);
	const hitCenterRate = 1 - Math.min(Math.abs(offsetZ), 1);

	// z方向(上下)の速度に反映
	vel.z = offsetZ * 0.6; // TODO 0.6を後で調整
	// x方向(左右)の反転方向を決める
	if (isLeftPaddle) {
		vel.x = Math.abs(vel.x);
		mesh.position.x = paddle.mesh.position.x + (PADDLE_THICKNESS / 2 + BALL_RADIUS + 0.1);
	} else {
		vel.x = -Math.abs(vel.x);
		mesh.position.x = paddle.mesh.position.x - (PADDLE_THICKNESS / 2 + BALL_RADIUS + 0.1);
	}
	
	// スピードの変化をつける
	const baseSpeedUp = 1.02;
	const extraSpeedUp = 0.10;
	const speedUp = baseSpeedUp + extraSpeedUp * hitCenterRate;
	const maxSpeed = 1.5;
	vel.x *= speedUp;
	vel.z *= speedUp;
	const currentSpeed = Math.sqrt(vel.x ** 2 + vel.z ** 2);
	
	// スピード上限
	if (currentSpeed > maxSpeed) {
		const scale = maxSpeed / currentSpeed;
		vel.x *= scale;
		vel.z *= scale;
	}
	console.log("ball reflect done");
}

// プレイ開始時のball positionと射出角度 //////////////////////////
function resetBallImp(ball: Ball, startFrom: 1 | 2 | "center", paddle1: Paddle, paddle2: Paddle) {
	console.log("reset ball called");
	let x = 0;
	let z = 0;

	// ball position
	const mergin = PADDLE_THICKNESS / 2 + BALL_RADIUS;
	if (startFrom === 1) {
		x = paddle1.mesh.position.x - mergin;
		z = paddle1.mesh.position.z;
	} else if (startFrom === 2) {
		x = paddle2.mesh.position.x + mergin;
		z = paddle2.mesh.position.z;
	} else {
		x = 0;
		z = 0;
	}

	ball.stop();
	ball.mesh.position.x = x;
	ball.mesh.position.y = 1;
	ball.mesh.position.z = z;
	ball.appear();
	console.log("ball reset done");
}
