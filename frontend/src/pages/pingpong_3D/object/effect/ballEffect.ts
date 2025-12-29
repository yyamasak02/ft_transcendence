import {
  Scene,
  Mesh,
  ParticleSystem,
  Texture,
  Color4,
  Vector3,
  Tools,
} from "@babylonjs/core";

export class ballTrack {
  private particleSystem: ParticleSystem;
  private scene: Scene;
  constructor(scene: Scene, ballMesh: Mesh) {
    this.scene = scene;
    this.particleSystem = new ParticleSystem("futureTrail", 300, scene);
    this.particleSystem.particleTexture = new Texture(
      "textures/flare.png",
      scene,
    );
    this.particleSystem.emitter = ballMesh;
    this.particleSystem.minEmitBox = new Vector3(0, 0, 0);
    this.particleSystem.maxEmitBox = new Vector3(0, 0, 0);
    this.particleSystem.color1 = new Color4(1.0, 1.0, 0.9, 1.0);
    this.particleSystem.color2 = new Color4(1.0, 0, 0.5, 0.8);
    this.particleSystem.colorDead = new Color4(1.0, 1.0, 0.9, 0.0);
    this.particleSystem.minSize = 0.15;
    this.particleSystem.maxSize = 0.5;
    this.particleSystem.minLifeTime = 0.2;
    this.particleSystem.maxLifeTime = 0.6;
    this.particleSystem.emitRate = 300;
    this.particleSystem.direction1 = new Vector3(-0.1, -0.1, -0.1);
    this.particleSystem.direction2 = new Vector3(0.1, 0.1, 0.1);
    this.particleSystem.minEmitPower = 0.5;
    this.particleSystem.maxEmitPower = 1.0;
    this.particleSystem.gravity = new Vector3(0, 0, 0);
    this.particleSystem.minAngularSpeed = Tools.ToRadians(-180);
    this.particleSystem.maxAngularSpeed = Tools.ToRadians(180);
    this.particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.particleSystem.start();
  }

  public spark(position: Vector3): void {
    const sparkSystem = new ParticleSystem("sparkEffect", 300, this.scene);
    sparkSystem.particleTexture = new Texture("textures/flare.png", this.scene);
    sparkSystem.emitter = position;
    sparkSystem.minEmitBox = new Vector3(0, 0, 0);
    sparkSystem.maxEmitBox = new Vector3(0, 0, 0);
    sparkSystem.color1 = new Color4(1.0, 1.0, 1.0, 1.0);
    sparkSystem.color2 = new Color4(1.0, 1.0, 0.8, 0.8);
    sparkSystem.colorDead = new Color4(1.0, 1.0, 1.0, 0.0);
    sparkSystem.minSize = 0.4;
    sparkSystem.maxSize = 0.6;
    sparkSystem.minLifeTime = 7;
    sparkSystem.maxLifeTime = 10;
    sparkSystem.emitRate = 1000;
    sparkSystem.direction1 = new Vector3(-3, -3, -3);
    sparkSystem.direction2 = new Vector3(3, 3, 3);
    sparkSystem.minEmitPower = 3;
    sparkSystem.maxEmitPower = 5;
    sparkSystem.gravity = new Vector3(0, 0, 0);
    sparkSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
    sparkSystem.targetStopDuration = 0.01;
    sparkSystem.disposeOnStop = true;
    sparkSystem.start();
  }

  dispose(): void {
    this.particleSystem.dispose();
  }
}
