// pingpong_3D/object/stageControl/cameraControl.ts
import { ArcRotateCamera } from "@babylonjs/core";

/** デスクトップ想定のプレイ中カメラ距離 */
export const BASE_PLAY_RADIUS = 80;

/** 真上から見るときの仰角（beta≈0 でY軸上。0 だと不安定になりやすいので極小値） */
export const PLAY_TOP_DOWN_BETA = 0.05;

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

  // モバイル縦向きでは「カメラが遠すぎて小さく見える」傾向があるため、
  // 画面比率に応じてプレイ距離（radius）の倍率を控えめに調整する。
  // 値は見た目合わせのためクランプして暴れを防ぐ。
  const factor = Math.min(1.4, Math.max(1.05, 1.25 + (aspect - 1) * 0.1));
  return BASE_PLAY_RADIUS * factor;
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

export function getPlayCameraAngles(): { alpha: number; beta: number } {
  // ArcRotateCamera: alpha は水平回転、beta は垂直（小さいほど真上）。
  // 要件:
  // - モバイル: 真上寄り（top-down）
  // - PC: 既存の斜め視点（alpha=PI/2, beta=PI/5）
  if (isMobileViewport()) {
    return { alpha: 0, beta: PLAY_TOP_DOWN_BETA };
  }
  return { alpha: Math.PI / 2, beta: Math.PI / 5 };
}
