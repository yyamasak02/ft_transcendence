// pingpong_3D/object/Stage.ts
import {
  Scene,
  Vector3,
  MeshBuilder,
  ArcRotateCamera,
  HemisphericLight,
  ShadowGenerator,
  GroundMesh,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { GAME_CONFIG } from "../core/constants3D";
import { Paddle } from "./Paddle";
import { Ball } from "./Ball";
import { createCourtMaterial } from "./materials/courtMaterial";
import { setupCameraForMobile } from "./stageControl/cameraControl";
import {
  createMainLight,
  createShadowLight,
  createGlowLayer,
} from "./stageControl/lightControl";
import type { GameSettings } from "../core/gameSettings";

const STAGE_CONSTS = {
  DEBRIS: {
    COLOR: new Color3(0.3, 0.1, 0.1),
    FALL_SPEED: 0.5,
    ROTATION_SPEED: 0.05,
    LIFETIME_MS: 2000,
    DISPOSE_HEIGHT: -30,
  },
  CUT_MARGIN: 0.1,
} as const;

// ============================================
// Stage クラス
// ============================================

export class Stage {
  camera: ArcRotateCamera;
  light: HemisphericLight;
  court: GroundMesh;
  shadowGen: ShadowGenerator;

  private scene: Scene;
  private debrisMaterial: StandardMaterial;

  private currentMinX: number;
  private currentMaxX: number;

  constructor(
    scene: Scene,
    canvas: HTMLCanvasElement,
    paddle1: Paddle,
    paddle2: Paddle,
    ball: Ball,
    settings: GameSettings,
  ) {
    this.scene = scene;
    const { COURT_WIDTH, COURT_HEIGHT } = GAME_CONFIG;

    this.currentMinX = -COURT_WIDTH / 2;
    this.currentMaxX = COURT_WIDTH / 2;
    this.debrisMaterial = new StandardMaterial("debrisMat", scene);
    this.debrisMaterial.diffuseColor = STAGE_CONSTS.DEBRIS.COLOR;

    // Court
    this.court = MeshBuilder.CreateGround(
      "court",
      { width: COURT_WIDTH, height: COURT_HEIGHT },
      scene,
    );
    this.court.material = createCourtMaterial(scene, settings);

    // camera
    this.camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 5,
      80,
      new Vector3(0, 0, 0),
      scene,
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

  public updateDestruction(paddle1: Paddle, paddle2: Paddle): void {
    const { PADDLE_THICKNESS } = GAME_CONFIG;
    const radius = PADDLE_THICKNESS / 2;
    const { CUT_MARGIN } = STAGE_CONSTS;
    const p2BackEdge = paddle2.mesh.position.x - radius;
    if (p2BackEdge > this.currentMinX + CUT_MARGIN) {
      this.executeCut(this.currentMinX, p2BackEdge, -1);
      this.currentMinX = p2BackEdge;
      this.resizeFloor();
    }

    const p1BackEdge = paddle1.mesh.position.x + radius;
    if (p1BackEdge < this.currentMaxX - CUT_MARGIN) {
      this.executeCut(p1BackEdge, this.currentMaxX, 1);
      this.currentMaxX = p1BackEdge;
      this.resizeFloor();
    }
  }

  public resetCourt(): void {
    const { COURT_WIDTH } = GAME_CONFIG;
    this.currentMinX = -COURT_WIDTH / 2;
    this.currentMaxX = COURT_WIDTH / 2;
    this.resizeFloor();
  }

  private resizeFloor(): void {
    const { COURT_WIDTH } = GAME_CONFIG;

    const newWidth = this.currentMaxX - this.currentMinX;
    const newCenterX = (this.currentMaxX + this.currentMinX) / 2;

    this.court.scaling.x = newWidth / COURT_WIDTH;
    this.court.position.x = newCenterX;
  }
  // 切り落とし
  private executeCut(fromX: number, toX: number, direction: number): void {
    const { COURT_HEIGHT } = GAME_CONFIG;
    const debrisConf = STAGE_CONSTS.DEBRIS;

    const dropWidth = Math.abs(toX - fromX);
    const centerX = (fromX + toX) / 2;
    const debris = MeshBuilder.CreateBox(
      "debris",
      {
        width: dropWidth,
        height: 0.5,
        depth: COURT_HEIGHT,
      },
      this.scene,
    );

    debris.position.set(centerX, this.court.position.y, this.court.position.z);
    debris.material = this.debrisMaterial;
    this.shadowGen.addShadowCaster(debris);

    // 落下演出
    const observer = this.scene.onBeforeRenderObservable.add(() => {
      if (debris.isDisposed()) return;

      debris.position.y -= debrisConf.FALL_SPEED;
      debris.rotation.z -= debrisConf.ROTATION_SPEED * direction;

      if (debris.position.y < debrisConf.DISPOSE_HEIGHT) {
        this.scene.onBeforeRenderObservable.remove(observer);
        debris.dispose();
      }
    });

    // 強制削除
    setTimeout(() => {
      if (!debris.isDisposed()) {
        this.scene.onBeforeRenderObservable.remove(observer);
        debris.dispose();
      }
    }, debrisConf.LIFETIME_MS);
  }
}
