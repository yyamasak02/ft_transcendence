// pingpong_3D/object/materials/ballMaterial.ts
import { StandardMaterial, Color3, Scene } from "@babylonjs/core";

export function createBallMaterial(scene: Scene): StandardMaterial {
	const mat = new StandardMaterial("ballMat", scene);
	mat.diffuseColor = new Color3(0.9, 0.9, 0.2); // ベース
	mat.specularColor = new Color3(0.3, 0.3, 0.3); // 光を反射する色
	mat.emissiveColor = new Color3(0.1, 0.1, 0.2); // 少し発光
	mat.specularPower = 32; //光沢の強さ
	return mat;
}