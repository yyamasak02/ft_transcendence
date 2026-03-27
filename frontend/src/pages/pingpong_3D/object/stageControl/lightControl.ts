// pingpong_3D/object/stageControl/lightControl.ts
import {
	Color3,
	DirectionalLight,
	GlowLayer,
	HemisphericLight,
	Scene,
	Vector3,
} from "@babylonjs/core";
import { isMobileViewport } from "./cameraControl";

// メインの光源
export function createMainLight(scene: Scene): HemisphericLight {
	const light = new HemisphericLight("mainLight", new Vector3(0, 1, 0), scene);
	if (isMobileViewport()) {
		light.intensity = 0.8;
		// モバイルは白飛びしやすいので、下方向の補助光を少しだけ足して穏やかにする
		light.groundColor = new Color3(0.22, 0.22, 0.26);
	} else {
		// PC は元の明るさ
		light.intensity = 1.0;
	}
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
	dirLight.intensity = isMobileViewport() ? 0.65 : 1.0;
	return dirLight;
}

// 表面を光らせる
export function createGlowLayer(scene: Scene): GlowLayer {
	const glow = new GlowLayer("glow", scene);
	glow.intensity = isMobileViewport() ? 0.1 : 0.25;
	return glow;
}
