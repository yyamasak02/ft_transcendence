import { Ball } from "../Ball";
import { Paddle } from "../Paddle";
import type { PaddleInput } from "../Paddle";
import { GAME_CONFIG } from "../../core/constants3D";
import type { PlayerType } from "../../../../utils/pingpong3D/gameSettings";
import type { PlayerController } from "./PlayerController";

const AI_CONFIG = {
  SCAN_INTERVAL: 1000,
  TOLERANCE: 0.42,
  Easy: {
    missRate: 0.1,
    delay: 200,
    predictionError: 12,
    strategicAimRate: 0,
    edgeRange: { min: 0, max: 0 },
  },
  Normal: {
    missRate: 0.01,
    delay: 50,
    predictionError: 5,
    strategicAimRate: 0,
    edgeRange: { min: 0, max: 0 },
  },
  Hard: {
    missRate: 0,
    delay: 0,
    predictionError: 0,
    strategicAimRate: 0.9,
    edgeRange: { min: 0.75, max: 0.9 },
  },
} as const;

/**
 * AI用コントローラー
 * PlayerControllerインターフェースを実装し、AI判断による入力を提供します
 */
export class AIController implements PlayerController {
  private lastSearchTime: number = 0;
  private targetPos: number = 0;
  private difficulty: Exclude<PlayerType, "Player">;
  private delayedTargetPos: number = 0;
  private lastActionTime: number = 0;

  constructor(difficulty: PlayerType) {
    this.difficulty = difficulty === "Player" ? "Normal" : difficulty;
    this.lastSearchTime = 0;
  }

  /**
   * AI判断による入力を取得（PlayerControllerインターフェース実装）
   */
  public getInput(ball: Ball, paddle: Paddle): PaddleInput {
    const now = Date.now();
    const config = AI_CONFIG[this.difficulty];

    if (now - this.lastSearchTime > AI_CONFIG.SCAN_INTERVAL) {
      this.lastSearchTime = now;

      // 見逃し
      if (Math.random() > config.missRate) {
        this.targetPos = this.calculatePredictedZ(ball, paddle);
        this.lastActionTime = now;
      }
    }

    // 反射速度
    if (now - this.lastActionTime > config.delay) {
      this.delayedTargetPos = this.targetPos;
    }

    const currentZ = paddle.mesh.position.z;

    return {
      up: currentZ > this.delayedTargetPos + AI_CONFIG.TOLERANCE,
      down: currentZ < this.delayedTargetPos - AI_CONFIG.TOLERANCE,
    };
  }

  dispose(): void {
    // クリーンアップ処理（現状は不要）
  }

  private calculatePredictedZ(ball: Ball, paddle: Paddle): number {
    if (ball.velocity.x > 0) return 0;

    const { COURT_HEIGHT } = GAME_CONFIG;
    const paddleX = paddle.mesh.position.x;
    const { x: bx, z: bz } = ball.mesh.position;
    const { x: vx, z: vz } = ball.velocity;

    const t = (paddleX - bx) / vx;
    let predictedZ = bz + vz * t;
    const bound = COURT_HEIGHT / 2 - 1.0;

    while (predictedZ > bound || predictedZ < -bound) {
      if (predictedZ > bound) predictedZ = 2 * bound - predictedZ;
      else if (predictedZ < -bound) predictedZ = -2 * bound - predictedZ;
    }

    const config = AI_CONFIG[this.difficulty];

    // 角打ち (Hard)
    if (this.difficulty === "Hard" && Math.random() < config.strategicAimRate) {
      const { min, max } = config.edgeRange;
      const randomFactor = Math.random() * (max - min) + min;
      const edge = (paddle.length / 2) * randomFactor;
      const weight = predictedZ > 0 ? -edge : edge;
      return predictedZ + weight;
    }

    // 予測ミス（Easy/Normal）
    const error = (Math.random() - 0.5) * config.predictionError;
    return predictedZ + error;
  }
}
