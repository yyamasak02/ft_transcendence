// pingpong_3D/object/materials/courtMaterial.ts
import { Scene, StandardMaterial, Color3 } from "@babylonjs/core";
import type { GameSettings } from "../../../../utils/pingpong3D/gameSettings";

export function createCourtMaterial(scene: Scene, settings: GameSettings) {
  const mat = new StandardMaterial("courtMat", scene);

  switch (settings.selectedStageIndex) {
    case 0:
      mat.diffuseColor = new Color3(0.0, 0.05, 0.2);
      mat.emissiveColor = new Color3(0.0, 0.2, 0.7);
      break;

    case 1:
      mat.diffuseColor = new Color3(0.02, 0.02, 0.02);
      mat.emissiveColor = new Color3(0.15, 0.15, 0.15);
      break;

    case 2:
      mat.diffuseColor = new Color3(0.25, 0.0, 0.3);
      mat.emissiveColor = new Color3(0.6, 0.0, 0.8);
      break;

    default:
      mat.diffuseColor = new Color3(0.0, 0.05, 0.2);
      mat.emissiveColor = new Color3(0.0, 0.2, 0.7);
      break;
  }

  // 照明のスペキュラー反射を抑えて盤面を見やすく（デフォルトの白スペキュラーだと眩しい）
  mat.specularColor = new Color3(0.02, 0.02, 0.02);
  mat.specularPower = 8;
  return mat;
}
