// pingpong_3D/object/ballPaddleUtils.ts　// game-main.ts用のutility関数
import { Mesh, Vector3 } from "@babylonjs/core";
import { GAME_CONFIG, COUNTDOWN_INTERVAL } from "../core/constants3D";
import type { Ball, GameState } from "./Ball";
import type { Paddle } from "./Paddle";
import { GameHUD } from "./ui3D/GameHUD";

const {
	PADDLE_LENGTH,
	PADDLE_THICKNESS,
	BALL_RADIUS,
} = GAME_CONFIG;

// 衝突判定
export function checkPaddleCollision(ballMesh: Mesh, paddleMesh: Mesh): boolean {
	const r = BALL_RADIUS;
	const bx = ballMesh.position.x;
	const bz = ballMesh.position.z;
	const px = paddleMesh.position.x;
	const pz = paddleMesh.position.z;
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

// サーブ初速・角度
export function randomServeVelocity(startFrom: "center" | 1 | 2): Vector3 {
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

// countdownに使用
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

// カウントダウン & サーブ
export async function countdownAndServe(
	startFrom: "center" | 1 | 2,
	ball: Ball,
	paddle1: Paddle,
	paddle2: Paddle,
	gameState: GameState,
	hud: GameHUD,
) {
	gameState.isServing = true;
	gameState.rallyActive = false;

	ball.stop();
	ball.reset(startFrom, paddle1, paddle2);

	console.log("COUNTDOWN_INTERVAL =", COUNTDOWN_INTERVAL);

	hud.setCountdown("3");
	await delay(COUNTDOWN_INTERVAL);
	hud.setCountdown("2");
	await delay(COUNTDOWN_INTERVAL);
	hud.setCountdown("1");
	await delay(COUNTDOWN_INTERVAL);
	hud.clearCountdown();
	
	ball.velocity = randomServeVelocity(startFrom);
	
	gameState.isServing = false;
	gameState.rallyActive = true;
}
