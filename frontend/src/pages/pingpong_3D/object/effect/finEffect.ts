import {
	Scene,
	Vector3,
	ParticleSystem,
	Texture,
	Color4,
} from "@babylonjs/core";
import { GAME_CONFIG } from "../../core/constants3D";

function createFireColumn(
	scene: Scene, 
	emitterPosition: Vector3, 
	winnerColor: Color4
): ParticleSystem
{
	const particleSystem = new ParticleSystem("winFireColumn", 3000, scene); 

	particleSystem.particleTexture = new Texture("textures/flare.png", scene);
	particleSystem.emitter = emitterPosition;

	particleSystem.minEmitBox = new Vector3(-0.2, 0, -0.2);
	particleSystem.maxEmitBox = new Vector3(0.2, 0.5, 0.2);

	particleSystem.color1 = winnerColor;
	particleSystem.color2 = winnerColor.clone();
	particleSystem.color2.a = 0.8;
	particleSystem.colorDead = new Color4(winnerColor.r * 0.5, winnerColor.g * 0.5, winnerColor.b * 0.5, 0.0);

	particleSystem.minSize = 1.5;
	particleSystem.maxSize = 4.0;
	particleSystem.minLifeTime = 2.0;
	particleSystem.maxLifeTime = 4.5;

	particleSystem.emitRate = 800; 
	particleSystem.direction1 = new Vector3(-0.5, 4, -0.5); 
	particleSystem.direction2 = new Vector3(0.5, 6, 0.5);
	particleSystem.minEmitPower = 4;
	particleSystem.maxEmitPower = 8;

	particleSystem.gravity = new Vector3(0, -9.81, 0);

	particleSystem.start();
	return particleSystem;
}

export function createWinEffect(scene: Scene, winner: 1 | 2): void {
	const { COURT_WIDTH, COURT_HEIGHT } = GAME_CONFIG;

	const winnerColor = winner === 1 
		? new Color4(1, 0.8, 0.2, 0.5)
		: new Color4(1, 0.8, 0.2, 0.5);

	const xDir = winner === 1 ? 1 : -1;
	const xPositions = [
		(COURT_WIDTH / 2 - 20) * xDir, 
		(COURT_WIDTH / 2 - 10) * xDir, 
		(COURT_WIDTH / 2) * xDir,
	];

	const emitterY = 0;
	const zPositions = [
		COURT_HEIGHT / 2 - 1, 
		-(COURT_HEIGHT / 2 - 1)
	];

	xPositions.forEach(x => {
		zPositions.forEach(z => {
		const pos = new Vector3(x, emitterY, z);
		createFireColumn(scene, pos, winnerColor);
		});
	});
}