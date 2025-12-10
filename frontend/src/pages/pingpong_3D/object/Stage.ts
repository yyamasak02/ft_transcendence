// pingpong_3D/object/Stage.ts
import {
  Scene,
  Vector3,
  MeshBuilder,
  ArcRotateCamera,
  HemisphericLight,
  ShadowGenerator,
	GroundMesh,
} from "@babylonjs/core";
import { GAME_CONFIG } from "../core/constants3D";
import { Paddle } from "./Paddle";
import { Ball } from "./Ball";
import { createCourtMaterial } from "./materials/courtMaterial";
import { setupCameraForMobile } from "./stageControl/cameraControl";
import { createMainLight, createShadowLight, createGlowLayer } from "./stageControl/lightControl";

// ============================================
// Stage クラス
// ============================================

export class Stage {
	camera: ArcRotateCamera;
	light: HemisphericLight;
	court: GroundMesh;
	shadowGen: ShadowGenerator;

	constructor(
		scene: Scene,
		canvas: HTMLCanvasElement,
		paddle1: Paddle,
		paddle2: Paddle,
		ball: Ball) {
		const { COURT_WIDTH, COURT_HEIGHT } = GAME_CONFIG;
		
		// Court
		this.court = MeshBuilder.CreateGround(
			"court",
			{ width: COURT_WIDTH, height: COURT_HEIGHT },
			scene
		);
		this.court.material = createCourtMaterial(scene);

		// camera
		this.camera = new ArcRotateCamera(
			"camera",
			Math.PI / 2,
			Math.PI / 5,
			80,
			new Vector3(0,0,0),
			scene
		);	
		this.camera.attachControl(canvas, true);
		this.camera.keysUp = [];
		this.camera.keysDown = [];
		this.camera.keysLeft = [];
		this.camera.keysRight = [];
		setupCameraForMobile(this.camera);
		
		// light
		this.light = createMainLight(scene);
		
		// GlowLayer
		createGlowLayer(scene);
		
		// Shadow
		const dirLight = createShadowLight(scene);
		this.shadowGen = new ShadowGenerator(1024, dirLight);
		
		this.shadowGen.useBlurExponentialShadowMap = true;
		this.shadowGen.blurKernel = 32;
		
		this.shadowGen.addShadowCaster(paddle1.mesh);
		this.shadowGen.addShadowCaster(paddle2.mesh);
		this.shadowGen.addShadowCaster(ball.mesh);
		this.court.receiveShadows = true;
		
		console.log("Stage initialized");
	}
	
	public resetCamera(): void {
		this.camera.alpha = Math.PI / 2;
		this.camera.beta = Math.PI / 5;
		this.camera.radius = 80;
		this.camera.setTarget(new Vector3(0, 0, 0));
	}
}
