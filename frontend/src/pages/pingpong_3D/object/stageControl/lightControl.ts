// pingpong_3D/object/stageControl/lightControl.ts
import {
	Color3,
	DirectionalLight,
	GlowLayer,
	HemisphericLight,
	Scene,
	Vector3,
} from "@babylonjs/core";

// メインの光源
export function createMainLight(scene: Scene): HemisphericLight {
	const light = new HemisphericLight("mainLight", new Vector3(0, 1, 0), scene);
	light.intensity = 0.85;
	// 下方向にもわずかに光を足してコントラストを和らげ、反射っぽい白飛びを抑える
	light.groundColor = new Color3(0.28, 0.28, 0.32);
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
	dirLight.intensity = 0.75;
	return dirLight;
}

// 表面を光らせる
export function createGlowLayer(scene: Scene): GlowLayer {
	const glow = new GlowLayer("glow", scene);
	glow.intensity = 0.12;
	return glow;
}
