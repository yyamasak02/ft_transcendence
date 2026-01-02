// pingpong_3D/object/ballPaddleUtils.ts // game-main.ts用のutility関数
import { Mesh, Vector3 } from "@babylonjs/core";
import { GAME_CONFIG } from "../core/constants3D";
import type { GameSettings } from "../../../utils/pingpong3D/gameSettings";
import type { Ball } from "./Ball";
import type { Paddle } from "./Paddle";
import { GameHUD } from "./ui3D/GameHUD";
import type { GameState } from "../core/game";

const { PADDLE_THICKNESS, BALL_RADIUS } = GAME_CONFIG;

export type UILockController = {
  lock: () => void;
  unlock: () => void;
};

// 衝突判定
export function checkPaddleCollision(ballMesh: Mesh, paddle: Paddle): boolean {
  const r = BALL_RADIUS;
  const bx = ballMesh.position.x;
  const bz = ballMesh.position.z;
  const px = paddle.mesh.position.x;
  const pz = paddle.mesh.position.z;
  const length = paddle.mesh.metadata?.length ?? 8;
  const halfL = length / 2;
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

  return dx ** 2 + dz ** 2 <= r ** 2;
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
  const angle =
    (Math.random() * (maxAngle - minAngle) + minAngle) *
    (Math.random() > 0.5 ? 1 : -1);

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

async function delayWithPause(
  ms: number,
  gameState: GameState,
  isCanceled: () => boolean,
): Promise<boolean> {
  let elapsed = 0;
  const tick = 50;

  while (elapsed < ms) {
    if (isCanceled()) return true;
    if (gameState.phase !== "pause") elapsed += tick;
    await delay(tick);
  }
  return false;
}

function cancelCountdown(
  gameState: GameState,
  hud: GameHUD,
  ui: UILockController,
) {
  hud.clearCountdown();
  gameState.isServing = false;
  gameState.rallyActive = false;
  ui.unlock();
}

// カウントダウン & サーブ
export async function countdownAndServe(
  startFrom: "center" | 1 | 2,
  ball: Ball,
  paddle1: Paddle,
  paddle2: Paddle,
  gameState: GameState,
  hud: GameHUD,
  settings: GameSettings,
  ui: UILockController,
) {
  const countdownID = ++gameState.countdownID;

  gameState.isServing = true;
  gameState.rallyActive = false;

  ui.lock();

  ball.stop();
  ball.reset(startFrom, paddle1, paddle2);

  const interval = settings.selectedCountdownSpeed;
  const canceled = () => countdownID !== gameState.countdownID;

  hud.setCountdown("3");
  if (await delayWithPause(interval, gameState, canceled)) {
    cancelCountdown(gameState, hud, ui);
    return;
  }

  hud.setCountdown("2");
  if (await delayWithPause(interval, gameState, canceled)) {
    cancelCountdown(gameState, hud, ui);
    return;
  }

  hud.setCountdown("1");
  if (await delayWithPause(interval, gameState, canceled)) {
    cancelCountdown(gameState, hud, ui);
    return;
  }

  hud.clearCountdown();
  gameState.isServing = false;
  gameState.rallyActive = true;

  ui.unlock();

  ball.velocity = randomServeVelocity(startFrom);
}
