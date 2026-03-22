// pingpong_3D/object/stageControl/cameraControl.ts
import { ArcRotateCamera } from "@babylonjs/core";

/** デスクトップ想定のプレイ中カメラ距離 */
export const BASE_PLAY_RADIUS = 80;

export function isMobileViewport(): boolean {
  return window.innerWidth < 768;
}

/**
 * プレイ中のカメラ半径。縦長・狭い画面ではコート全体が収まるよう引く。
 */
export function getPlayRadius(): number {
  if (!isMobileViewport()) {
    return BASE_PLAY_RADIUS;
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = h / Math.max(w, 1);
  // ポートレートほど横が狭いので同じ80だとコートが画面からはみ出す → 半径を伸ばす
  const baseFactor = 1.85;
  const extra = Math.min(0.55, Math.max(0, aspect - 1.25) * 0.45);
  return BASE_PLAY_RADIUS * (baseFactor + extra);
}

/** ゲームオーバー時のズームアウト先半径 */
export function getEndGameZoomRadius(): number {
  const desktopTarget = 150;
  if (!isMobileViewport()) return desktopTarget;
  return desktopTarget * (getPlayRadius() / BASE_PLAY_RADIUS);
}

export function setupCameraForMobile(camera: ArcRotateCamera): void {
  const r = getPlayRadius();
  if (isMobileViewport()) {
    camera.radius = r;
    camera.lowerRadiusLimit = r;
    camera.upperRadiusLimit = r;
    camera.panningSensibility = 0;
    camera.angularSensibilityX = 9000;
    camera.angularSensibilityY = 9000;
  }
}

/** 向き変更・リサイズ後に呼び、プレイ半径を再適用 */
export function applyPlayRadiusToCamera(camera: ArcRotateCamera): void {
  const r = getPlayRadius();
  camera.radius = r;
  if (isMobileViewport()) {
    camera.lowerRadiusLimit = r;
    camera.upperRadiusLimit = r;
  } else {
    camera.lowerRadiusLimit = 0.01;
    camera.upperRadiusLimit = 20000;
  }
}
