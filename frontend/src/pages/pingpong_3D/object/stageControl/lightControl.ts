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
	// 半球光＋平行光の積み上げでモバイル表示が白飛びしやすいためやや抑える
	light.intensity = 0.88;
	return light;
}

// 影を作るための光源
export function createShadowLight(scene: Scene): DirectionalLight {
	// 以前は (-0.5,-1,-0.3) で +X,+Z 斜め上からの成分が強く、コート右下付近に鏡面が乗りやすかった
	const dirLight = new DirectionalLight(
		"dirLight",
		new Vector3(0, -1, -0.22),
		scene,
	);
	dirLight.position = new Vector3(0, 26, 10);
	dirLight.intensity = 0.92;
	// コートはデフォルトの白い specular のままなので、平行光側の鏡面寄与を抑えて白飛びを防ぐ
	dirLight.specular = new Color3(0.14, 0.14, 0.16);
	return dirLight;
}

// 表面を光らせる
export function createGlowLayer(scene: Scene): GlowLayer {
	const glow = new GlowLayer("glow", scene);
	glow.intensity = 0.25;
	return glow;
}
