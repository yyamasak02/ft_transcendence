import { ArcRotateCamera, Vector3 } from "@babylonjs/core";
import {
  getPlayCameraAngles,
  getPlayRadius,
  PLAY_TOP_DOWN_BETA,
} from "../stageControl/cameraControl";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let zoomIntervalID: number | null = null;
let transitionIntervalID: number | null = null;

export function transitionToPlayView(
  camera: ArcRotateCamera,
  duration: number = 1500,
): Promise<void> {
  return new Promise((resolve) => {
    stopZoomOut();
    if (transitionIntervalID !== null) {
      clearInterval(transitionIntervalID);
    }
    const { alpha: targetAlpha, beta: targetBeta } = getPlayCameraAngles();
    const targetRadius = getPlayRadius();

    const startAlpha = camera.alpha;
    const startBeta = camera.beta;
    const startRadius = camera.radius;
    const startTime = Date.now();

    transitionIntervalID = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);

      camera.alpha = startAlpha + (targetAlpha - startAlpha) * ease;
      camera.beta = startBeta + (targetBeta - startBeta) * ease;
      camera.radius = startRadius + (targetRadius - startRadius) * ease;
      camera.setTarget(Vector3.Zero());

      if (t === 1) {
        if (transitionIntervalID !== null) {
          clearInterval(transitionIntervalID);
          transitionIntervalID = null;
        }
        resolve();
      }
    }, 1000 / 60);
  });
}

// カットイン
export async function cutIn(camera: ArcRotateCamera, ballPosition: Vector3) {
  const CUT_IN_DELAY = 500;
  const { alpha: playAlpha } = getPlayCameraAngles();
  const isPortraitMobile = playAlpha === 0;
  const configs = [
    { alpha: isPortraitMobile ? 0 : Math.PI / 2, beta: PLAY_TOP_DOWN_BETA, radius: 15 },
    { alpha: camera.alpha, beta: PLAY_TOP_DOWN_BETA, radius: 10 },
    { alpha: isPortraitMobile ? -Math.PI / 4 : Math.PI / 4, beta: PLAY_TOP_DOWN_BETA, radius: 20 },
  ];

  for (const config of configs) {
    camera.setTarget(ballPosition.clone());
    camera.alpha = config.alpha;
    camera.beta = config.beta;
    camera.radius = config.radius;
    await delay(CUT_IN_DELAY);
  }
}

// ズームアウト
export function zoomOut(
  camera: ArcRotateCamera,
  targetRadius: number,
  duration: number,
) {
  stopZoomOut();

  const startRadius = camera.radius;
  const startAlpha = camera.alpha;
  const startBeta = camera.beta;
  const { beta: endBeta } = getPlayCameraAngles();
  const startTime = Date.now();
  const TOTAL_ROTATION = Math.PI * 3;

  zoomIntervalID = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    const t = Math.min(1, elapsed / duration);
    const easeOutT = 1 - Math.pow(1 - t, 3);

    camera.setTarget(Vector3.Zero());
    camera.radius = startRadius + (targetRadius - startRadius) * easeOutT;
    camera.alpha = startAlpha + TOTAL_ROTATION * easeOutT;
    camera.beta = startBeta + (endBeta - startBeta) * easeOutT;

    if (t === 1) {
      stopZoomOut();
      console.log("Zoom out finished.");
    }
  }, 1000 / 60);
}

export function stopZoomOut() {
  if (zoomIntervalID !== null) {
    clearInterval(zoomIntervalID);
    zoomIntervalID = null;
  }
  if (transitionIntervalID !== null) {
    clearInterval(transitionIntervalID);
    transitionIntervalID = null;
  }
}
