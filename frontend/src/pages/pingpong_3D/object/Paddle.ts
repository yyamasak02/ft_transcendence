// pingpong_3D/object/Paddle.ts
import { Mesh, MeshBuilder, Vector3, Scene,} from "@babylonjs/core";
import { GAME_CONFIG } from "../core/constants";

const { COURT_HEIGHT, PADDLE_LENGTH, PADDLE_THICKNESS } = GAME_CONFIG;

export type PaddleInput = {
	up: boolean;
	down: boolean;
};

// ============================================
// Paddle クラス
// ============================================
export class Paddle {
	mesh: Mesh;

	constructor(scene: Scene, position: Vector3) {
		this.mesh = MeshBuilder.CreateCylinder(
			"paddle",
			{ 
				height: PADDLE_LENGTH,
				diameterTop: PADDLE_THICKNESS,
				diameterBottom: PADDLE_THICKNESS
			},
			scene
		);
		this.mesh.position.copyFrom(position);
		this.mesh.rotation.x = Math.PI / 2;
	}

	move(dz: number) { this.mesh.position.z += dz; }
	update(deltaTime: number, input: PaddleInput) { updateImp(this, deltaTime, input); }
}

// ============================================
// 内部実装部
// ============================================

function updateImp(paddle: Paddle, deltaTime: number, input: PaddleInput) {
	console.log("update paddle called");
	const speed = 0.05 * deltaTime;
	const halfHeight = COURT_HEIGHT / 2;
	const margin = 2;
	
	// 移動
	if (input.up) { paddle.mesh.position.z -= speed; }
	if (input.down) { paddle.mesh.position.z += speed; }
	// 上限下限
	if (paddle.mesh.position.z < -halfHeight + margin) { paddle.mesh.position.z = -halfHeight + margin; }
	if (paddle.mesh.position.z > halfHeight - margin) { paddle.mesh.position.z = halfHeight - margin; }
	console.log("update paddle done");
}
