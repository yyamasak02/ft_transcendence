// pingpong_3D/object/Ball.ts
import { Mesh, MeshBuilder, Vector3, Scene } from "@babylonjs/core";
import { GAME_CONFIG } from "../core/constants3D";
// import { loadSettings } from "../core/gameSettings"; 
import { Paddle } from "./Paddle"
import { createBallMaterial } from "./materials/ballMaterial";

export type GameState = {
	rallyActive: boolean;
	isServing: boolean;
	lastWinner: 1 | 2 | null;
}
export type ScoreResult = { scorer: 1 | 2 } | null;

const {
	COURT_WIDTH,
	COURT_HEIGHT,
	PADDLE_THICKNESS,
	BALL_RADIUS,
} = GAME_CONFIG;

// const settings = loadSettings();
// const BALL_SPEED = settings.ballSpeed;

// ============================================
// Ball クラス
// ============================================

export class Ball {
	mesh: Mesh;
	velocity: Vector3;
	private baseSpeed: number;

	constructor(scene: Scene, initialPosition: Vector3, baseSpeed: number) {
		this.baseSpeed = baseSpeed;
		this.mesh = MeshBuilder.CreateSphere("ball", { diameter: 2 }, scene);
		this.mesh.visibility = 0;
		this.mesh.position.copyFrom(initialPosition);
		this.velocity = new Vector3(1, 0, 0);
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
		checkPaddleCollision: (ballMesh: Mesh, paddle: Paddle) => boolean
		): ScoreResult { 
		return updateBallImp(this, deltaTime, paddle1, paddle2, gameState, this.baseSpeed, checkPaddleCollision); 
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
	deltaTime: number,
	paddle1: Paddle,
	paddle2: Paddle,
	gameState: GameState,
	baseSpeed: number,
	checkPaddleCollision: (ballMesh: Mesh, paddle: Paddle) => boolean
): ScoreResult {
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
	// const dt = (deltaTime / 1000) * getBallSpeed(); // ballスピードを決める部分
	const dt = (deltaTime / 1000) * baseSpeed; // ballスピードを決める部分
	ball.mesh.position.x += ball.velocity.x * dt;
	ball.mesh.position.z += ball.velocity.z * dt;
	// paddle1
	if (checkPaddleCollision(ball.mesh, paddle1)) ball.reflect(paddle1, false);
	// paddle2
	if (checkPaddleCollision(ball.mesh, paddle2)) ball.reflect(paddle2, true);
	
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
	return null;
}

// ballとpaddleの衝突角度によって反射の強さを変える /////////////////
function reflectBallImp(ball: Ball, paddle: Paddle, isLeftPaddle: boolean) {
	const mesh = ball.mesh;
	const vel	 = ball.velocity;
	
	// paddleの中心からどれだけ離れているか
	const offsetZ = (mesh.position.z - paddle.mesh.position.z) / (paddle.length / 2);
	const clamped = Math.max(-1, Math.min(1, offsetZ));
	const hitCenterRate = 1 - Math.abs(clamped);
	const power = 0.8 + hitCenterRate * 0.3; // 跳ね返りの強さを0.25~0.4で調整

	// 方向ベクトル再構築
	const dirX = isLeftPaddle ? 1 : -1;
	vel.x = dirX;
	vel.z = clamped;

	// ゼロベクトル防止
	if (vel.lengthSquared() === 0) {
		vel.x = dirX;
		vel.z = 0;
	}

	// 正規化->強さ適用
	vel.normalize();
	vel.scaleInPlace(power);

	// めり込み防止
	if (isLeftPaddle) {
		mesh.position.x = paddle.mesh.position.x + (PADDLE_THICKNESS / 2 + BALL_RADIUS + 0.1);
	} else {
		mesh.position.x = paddle.mesh.position.x - (PADDLE_THICKNESS / 2 + BALL_RADIUS + 0.1);
	}
}

// プレイ開始時のball positionと射出角度 //////////////////////////
function resetBallImp(ball: Ball, startFrom: 1 | 2 | "center", paddle1: Paddle, paddle2: Paddle) {	
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
}
