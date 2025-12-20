// pingpong_3D/object/stageControl/cameraControl.ts
import { ArcRotateCamera } from "@babylonjs/core";

export function setupCameraForMobile(camera: ArcRotateCamera) {
  if (window.innerWidth < 768) {
    camera.radius *= 1.8;
    camera.lowerRadiusLimit = camera.radius;
    camera.upperRadiusLimit = camera.radius;
    camera.panningSensibility = 0;
    camera.angularSensibilityX = 9000;
    camera.angularSensibilityY = 9000;
  }
}
