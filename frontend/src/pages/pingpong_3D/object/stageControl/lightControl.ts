// pingpong_3D/object/stageControl/lightControl.ts
import { DirectionalLight, GlowLayer, HemisphericLight, Scene, Vector3 } from "@babylonjs/core";

// メインの光源
export function createMainLight(scene: Scene): HemisphericLight {
	const light = new HemisphericLight("mainLight", new Vector3(0, 1, 0), scene);
	light.intensity = 1.0; // 強さ 0.0 - 2.0
	return light;
}

// 影を作るための光源
export function createShadowLight(scene: Scene): DirectionalLight {
	const dirLight = new DirectionalLight(
		"dirLight",
		new Vector3(-0.5, -1, -0.3), // 向き
		scene
	);
	dirLight.position = new Vector3(0, 20, 20); // 設置場所
	return dirLight;
}

// 表面を光らせる
export function createGlowLayer(scene: Scene): GlowLayer {
	const glow = new GlowLayer("glow", scene);
	glow.intensity = 0.25;
	return glow;
}
