// object/player/RemoteController.ts
import type { Ball } from "../Ball";
import type { Paddle, PaddleInput } from "../Paddle";
import type { PlayerController } from "./PlayerController";

type Direction = "up" | "down" | "stop";

/**
 * 相手プレイヤー入力をWSで受け取り反映するコントローラ
 */
export class RemoteController implements PlayerController {
  private direction: Direction = "stop";

  setDirection(dir: Direction) {
    if (dir === "up" || dir === "down" || dir === "stop") {
      this.direction = dir;
    }
  }

  getInput(_ball: Ball, _paddle: Paddle): PaddleInput {
    return {
      up: this.direction === "up",
      down: this.direction === "down",
    };
  }
}
