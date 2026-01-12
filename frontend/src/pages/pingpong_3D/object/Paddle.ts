// pingpong_3D/object/Paddle.ts
import { Mesh, MeshBuilder, Vector3, Scene } from "@babylonjs/core";
import { GAME_CONFIG } from "../core/constants3D";
import type { GameSettings } from "../../../utils/pingpong3D/gameSettings";
import { createPaddleMaterial } from "./materials/paddleMaterial";

export type PaddleInput = {
  up: boolean;
  down: boolean;
};

const { COURT_HEIGHT, PADDLE_THICKNESS } = GAME_CONFIG;

const PADDLE_CONSTS = {
  SPEED_FACTOR: 0.025,
  MOVE_MARGIN: 2.0,

  RALLY: {
    LEVEL_STEP: 10,
    ADVANCE_PER_LEVEL: 1.5,
    MAX_ADVANCE: 25.0,
    UPDATE_THRESHOLD: 0.01,
  },

  INIT: {
    X_OFFSET: 1.0,
    Y_POS: 1.0,
  },
} as const;

// ============================================
// Paddle クラス
// ============================================

export class Paddle {
  mesh: Mesh;
  length: number;
  private initialPosition: Vector3;

  constructor(scene: Scene, position: Vector3, length: number) {
    this.length = length;
    this.initialPosition = position.clone();

    this.mesh = MeshBuilder.CreateCylinder(
      "paddle",
      {
        height: length,
        diameterTop: PADDLE_THICKNESS,
        diameterBottom: PADDLE_THICKNESS,
      },
      scene,
    );
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.copyFrom(position);
    this.mesh.metadata = { length };
  }

  move(dz: number) {
    this.mesh.position.z += dz;
  }

  update(deltaTime: number, input: PaddleInput) {
    updateImp(this, deltaTime, input);
  }

  updateRallyPosition(
    rallyCount: number,
    isRallyRushEnabled: boolean,
    onMove?: () => void,
  ) {
    let targetX = this.initialPosition.x;
    const { LEVEL_STEP, ADVANCE_PER_LEVEL, MAX_ADVANCE, UPDATE_THRESHOLD } =
      PADDLE_CONSTS.RALLY;

    if (isRallyRushEnabled && rallyCount > 0) {
      const level = Math.floor(rallyCount / LEVEL_STEP);
      if (level > 0) {
        const advance = Math.min(level * ADVANCE_PER_LEVEL, MAX_ADVANCE);
        targetX =
          this.initialPosition.x +
          (this.initialPosition.x > 0 ? -advance : advance);
      }
    }

    // 位置が実際に変わった場合のみ更新＆通知
    if (Math.abs(this.mesh.position.x - targetX) > UPDATE_THRESHOLD) {
      this.mesh.position.x = targetX;

      // ★ ここで「動いたよ！」と通知（崩落処理を実行）
      if (onMove) {
        onMove();
      }
    }
  }
}

export function createPaddles(scene: Scene, settings: GameSettings) {
  const width = GAME_CONFIG.COURT_WIDTH;
  const {
    player1Color: p1c,
    player1Length: p1l,
    player2Color: p2c,
    player2Length: p2l,
  } = settings;
  const { X_OFFSET, Y_POS } = PADDLE_CONSTS.INIT;

  const xPos = width / 2 - X_OFFSET;

  const p1 = new Paddle(scene, new Vector3(xPos, Y_POS, 0), p1l);
  p1.mesh.material = createPaddleMaterial("p1", p1c, scene);

  const p2 = new Paddle(scene, new Vector3(-xPos, Y_POS, 0), p2l);
  p2.mesh.material = createPaddleMaterial("p2", p2c, scene);

  return { p1, p2 };
}

// ============================================
// 内部実装部
// ============================================

function updateImp(paddle: Paddle, deltaTime: number, input: PaddleInput) {
  const speed = PADDLE_CONSTS.SPEED_FACTOR * deltaTime;

  const halfHeight = COURT_HEIGHT / 2;
  const margin = PADDLE_CONSTS.MOVE_MARGIN;

  // 移動
  if (input.up) {
    paddle.mesh.position.z -= speed;
  }
  if (input.down) {
    paddle.mesh.position.z += speed;
  }

  // 上限下限
  const limit = halfHeight - margin;
  if (paddle.mesh.position.z < -limit) {
    paddle.mesh.position.z = -limit;
  }
  if (paddle.mesh.position.z > limit) {
    paddle.mesh.position.z = limit;
  }
}
