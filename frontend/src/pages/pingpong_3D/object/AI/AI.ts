import { Ball } from "../Ball";
import { Paddle } from "../Paddle";
import type { PaddleInput } from "../Paddle";
import { GAME_CONFIG } from "../../core/constants3D";
import type { PlayerType } from "../../core/gameSettings";

export class AIController {
  private lastSearchTime: number = 0;
  private targetPos: number = 0;
  private difficulty: PlayerType;
  private delayedTargetPos: number = 0;
  private lastActionTime: number = 0;

  constructor(difficulty: PlayerType) {
    this.difficulty = difficulty;
  }

  public getInputs(ball: Ball, paddle: Paddle): PaddleInput {
    const now = Date.now();

    if (now - this.lastSearchTime > 1000) {
      this.lastSearchTime = now;

      // 見逃し
      let missRate = 0;
      if (this.difficulty === "Easy") {
        missRate = 0.1;
      } else if (this.difficulty === "Normal") {
        missRate = 0.01;
      }
      if (Math.random() > missRate) {
        this.targetPos = this.calculatePredictedZ(ball, paddle);
        this.lastActionTime = now;
      }
    }

    // 反応速度
    let delay = 0;
    if (this.difficulty === "Easy") {
      delay = 200;
    } else if (this.difficulty === "Normal") {
      delay = 50;
    }
    if (now - this.lastActionTime > delay) {
      this.delayedTargetPos = this.targetPos;
    }

    const currentZ = paddle.mesh.position.z;
    const tolerance = 0.5;

    return {
      up: currentZ > this.delayedTargetPos + tolerance,
      down: currentZ < this.delayedTargetPos - tolerance,
    };
  }

  private calculatePredictedZ(ball: Ball, paddle: Paddle): number {
    if (ball.velocity.x > 0) return 0;

    const { COURT_HEIGHT } = GAME_CONFIG;
    const paddleX = paddle.mesh.position.x;
    const ballPos = ball.mesh.position;
    const ballVel = ball.velocity;

    const t = (paddleX - ballPos.x) / ballVel.x;
    let predictedZ = ballPos.z + ballVel.z * t;

    const bound = COURT_HEIGHT / 2 - 2;
    while (predictedZ > bound || predictedZ < -bound) {
      if (predictedZ > bound) predictedZ = 2 * bound - predictedZ;
      else if (predictedZ < -bound) predictedZ = -2 * bound - predictedZ;
    }

    // 予測ミス
    let error = 0;
    if (this.difficulty === "Easy") error = 12;
    else if (this.difficulty === "Normal") error = 5;

    return predictedZ + (Math.random() - 0.5) * error;
  }
}
