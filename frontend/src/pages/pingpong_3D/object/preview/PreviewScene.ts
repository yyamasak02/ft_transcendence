// pingpong_3D/object/preview/PreviewScene.ts　設定のプレビュー画面
import {
	Engine,
	Scene,
	FreeCamera,
	Vector3,
	HemisphericLight,
	MeshBuilder,
	StandardMaterial,
	Color3,
	Mesh,
} from "@babylonjs/core";

// ============================================
// PreviewScene クラス
// ============================================
export class PreviewScene {
	engine: Engine;
	scene: Scene;
	paddle1: Mesh;
	paddle2: Mesh;
	ground!: Mesh;
	groundMat!: StandardMaterial;

	constructor(canvas: HTMLCanvasElement) {
		this.engine = new Engine(canvas, true, {preserveDrawingBuffer: true, premultipliedAlpha: false});
		this.scene = new Scene(this.engine);

		const camera = new FreeCamera("cam", new Vector3(0, 30, -20), this.scene);
		camera.setTarget(Vector3.Zero());

		new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

		// Court
		this.ground = MeshBuilder.CreateGround("ground", {width: 40, height: 20 }, this.scene);
		this.groundMat = new StandardMaterial("gmat", this.scene);
		this.groundMat.diffuseColor = new Color3(1, 1, 1);
		this.ground.material = this.groundMat;

		// Paddle
		this.paddle1 = MeshBuilder.CreateBox("p1", { width: 1, height: 1, depth: 8 }, this.scene);
		this.paddle1.position.x = -20;
		this.paddle2 = MeshBuilder.CreateBox("p2", { width: 1, height: 1, depth: 8 }, this.scene);
		this.paddle2.position.x = 20;

		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	updatePreview(p1Length: number, p1Color: string, p2Length: number, p2Color: string, stageIndex: number) {
		if (!this.paddle1 || !this.paddle2) return;

		this.paddle1.scaling.z = p1Length / 8;
		this.paddle2.scaling.z = p2Length / 8;

		// 色変換マップ
		const colorMap: Record<string, Color3> = {
			blue:   new Color3(0.3, 0.4, 1),
			green:  new Color3(0.3, 1, 0.3),
			red:    new Color3(1, 0.2, 0.2),
			yellow: new Color3(1, 1, 0.2),
			white:  new Color3(0.9, 0.9, 0.9),
			black:  new Color3(0.1, 0.1, 0.1),
			pink:   new Color3(1, 0.6, 0.8),
		};

		// paddle更新
		const mat1 = new StandardMaterial("pmat1", this.scene);
		mat1.diffuseColor = colorMap[p1Color] ?? Color3.White();
		this.paddle1.material = mat1;
		const mat2 = new StandardMaterial("pmat2", this.scene);
		mat2.diffuseColor = colorMap[p2Color] ?? Color3.White();
		this.paddle2.material = mat2;

		// ステージ色（本番ステージに近い感じで適当に 3 パターン）
		switch (stageIndex) {
			case 1: // Shadow Court
				this.groundMat.diffuseColor = new Color3(0.02, 0.02, 0.08);
				this.groundMat.emissiveColor = new Color3(0.05, 0.05, 0.2);
				break;
			case 2: // Warp Court
				this.groundMat.diffuseColor = new Color3(0.05, 0.0, 0.1);
				this.groundMat.emissiveColor = new Color3(0.2, 0.0, 0.4);
				break;
			default: // Classic Court
				this.groundMat.diffuseColor = new Color3(0.1, 0.1, 0.2);
				this.groundMat.emissiveColor = new Color3(0.0, 0.1, 0.35);
				break;
		}
	}

	dispose() {
		if (this.scene && !this.scene.isDisposed) {
			this.scene.dispose();
		}
		if (this.engine) {
			this.engine.stopRenderLoop();
			this.engine.dispose();
		}
	}
}
