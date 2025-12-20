// pingpong_3D/object/materials/paddleMaterial.ts
import { StandardMaterial, Color3, Scene } from "@babylonjs/core";

export function createPaddleMaterial(id: string, color: string, scene: Scene) {
  const mat = new StandardMaterial(id, scene);

  const map: Record<string, Color3> = {
    blue: new Color3(0.3, 0.4, 1),
    green: new Color3(0.3, 1, 0.3),
    red: new Color3(1, 0.2, 0.2),
    yellow: new Color3(1, 1, 0.2),
    white: new Color3(0.9, 0.9, 0.9),
    black: new Color3(0.1, 0.1, 0.1),
    pink: new Color3(1, 0.6, 0.8),
  };
  mat.diffuseColor = map[color] ?? new Color3(1, 1, 1);
  mat.ambientColor = new Color3(0.1, 0.1, 0.1);
  mat.emissiveColor = new Color3(0, 0, 0);
  mat.backFaceCulling = false;

  return mat;
}
