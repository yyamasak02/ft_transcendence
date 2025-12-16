import { ArcRotateCamera, Vector3 } from "@babylonjs/core";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let zoomIntervalID: number | null = null;

// カットイン
export async function cutIn(camera: ArcRotateCamera, ballPosition: Vector3) {
  const CUT_IN_DELAY = 500;
  const configs = [
    { alpha: Math.PI / 2, beta: Math.PI / 2.5, radius: 15 },
    { alpha: camera.alpha, beta: 0.1, radius: 10 },
    { alpha: Math.PI / 4, beta: Math.PI / 4, radius: 20 },
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
  if (zoomIntervalID !== null) {
    clearInterval(zoomIntervalID);
    zoomIntervalID = null;
  }

  const startRadius = camera.radius;
  const startAlpha = camera.alpha;
  const startTime = Date.now();
  const TOTAL_ROTATION = Math.PI * 3;

  const intervalID = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    const t = Math.min(1, elapsed / duration);
    const easeOutT = 1 - Math.pow(1 - t, 3);

    camera.setTarget(Vector3.Zero());
    camera.radius = startRadius + (targetRadius - startRadius) * easeOutT;
    camera.alpha = startAlpha + TOTAL_ROTATION * easeOutT;
    camera.beta = Math.PI / 5 + (Math.PI / 10) * easeOutT;

    if (t === 1) {
      clearInterval(intervalID);
      zoomIntervalID = null;
      console.log("Zoom out finished.");
    }
  }, 1000 / 60);
  return intervalID;
}

export function stopZoomOut(id: number | null) {
  if (id !== null) {
    clearInterval(id);
  }
}
