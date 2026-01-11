// object/player/HumanController.ts
import type { Ball } from "../Ball";
import type { Paddle, PaddleInput } from "../Paddle";
import type { PlayerController } from "./PlayerController";
import type { InputManager } from "../../input/keyboard";

/**
 * 人間プレイヤー用コントローラー
 * キーボード入力をInputManagerから取得します
 */
export class HumanController implements PlayerController {
  private inputManager: InputManager;
  private playerIndex: 1 | 2;

  constructor(inputManager: InputManager, playerIndex: 1 | 2) {
    this.inputManager = inputManager;
    this.playerIndex = playerIndex;
  }

  /**
   * キーボード入力を取得
   */
  getInput(_ball: Ball, _paddle: Paddle): PaddleInput {
    const inputs = this.inputManager.getPaddleInputs();
    return this.playerIndex === 1 ? inputs.p1 : inputs.p2;
  }

  dispose(): void {
    // 現状はクリーンアップ不要
    // 将来的にイベントリスナーなどを持つ場合はここで解放
  }
}
