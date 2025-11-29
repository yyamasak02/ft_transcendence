// pingpong_3D/object/materials/paddleMaterial.ts
import { StandardMaterial, Color3, Scene } from "@babylonjs/core";

export function createPaddleMaterial(type: "p1" | "p2", scene: Scene) {
	const mat = new StandardMaterial(`paddleMat_${type}`, scene);

	if (type === "p1") {
		mat.diffuseColor = new Color3(0.1, 0.6, 1.0);
		mat .emissiveColor = new Color3(0.1, 0.7, 1.3);
	} else {
		mat.diffuseColor = new Color3(1.0, 0.4, 0.4);
		mat.emissiveColor = new Color3(1.3, 0.4, 0.4);
	}

	return mat;
}
