// pingpong_3D/object/materials/courtMaterial.ts
import { Scene, StandardMaterial, Color3 } from "@babylonjs/core";

export function createCourtMaterial(scene: Scene) {
	const mat = new StandardMaterial("courtMat", scene);
	mat.diffuseColor = new Color3(0.0, 0.05, 0.2);
	mat.emissiveColor = new Color3(0.0, 0.2, 0.7);
	return mat;
}
