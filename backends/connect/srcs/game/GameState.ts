import { Ball, Paddle } from "../types/room_type.js";

export class GameState {
  private _ball: Ball;
  private _paddles: Map<string, Paddle>;

  // private DELTA_X: number = 10;
  private DELTA_Y: number = 10;

  constructor(userIds: string[]) {
    this._ball = {
      position: { x: 0, y: 0 },
      velocity: { x: 1, y: 1 },
      radius: 5,
    };

    this._paddles = new Map(
      userIds.map((id) => [id, { userId: id, y: 0, height: 50, speed: 5 }]),
    );
  }

  update(playerId: string, key: string) {
    const paddle = this._paddles.get(playerId);
    console.log("server paddle: ", paddle);
    if (!paddle) {
      return;
    }
    if (key === "ArrowUp") {
      paddle.y += this.DELTA_Y;
    }
    if (key === "ArrowDown") {
      paddle.y -= this.DELTA_Y;
    }
    return this.getGameStateInfo();
  }

  getGameStateInfo() {
    return {
      ball: {
        position: this._ball.position,
        radius: this._ball.radius,
      },
      paddles: [...this._paddles.values()].map((p) => ({
        userId: p.userId,
        y: p.y,
        height: p.height,
      })),
    };
  }
}
