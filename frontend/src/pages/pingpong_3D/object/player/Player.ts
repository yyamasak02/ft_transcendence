// object/player/Player.ts
import type { Paddle, PaddleInput } from "../Paddle";
import type { Ball } from "../Ball";
import type { PlayerController } from "./PlayerController";

/**
 * プレイヤークラス
 * パドルとコントローラーを管理し、入力と更新を統一的に扱います
 */
export class Player {
  public readonly paddle: Paddle;
  private controller: PlayerController;
  public readonly playerIndex: 1 | 2;
  public readonly authority: "local" | "remote" | "server" = "local";

  constructor(
    paddle: Paddle,
    controller: PlayerController,
    playerIndex: 1 | 2,
  ) {
    this.paddle = paddle;
    this.controller = controller;
    this.playerIndex = playerIndex;
  }

  /**
   * プレイヤーの入力を取得
   * @param ball - ボールオブジェクト（AI判断に使用）
   * @returns パドルの入力
   */
  getInput(ball: Ball): PaddleInput {
    return this.controller.getInput(ball, this.paddle);
  }

  /**
   * プレイヤーを更新（入力取得 + パドル更新）
   * @param deltaTime - 前フレームからの経過時間
   * @param ball - ボールオブジェクト
   */
  update(deltaTime: number, ball: Ball): void {
    const input = this.getInput(ball);
    this.paddle.update(deltaTime, input);
  }

  /**
   * コントローラーを変更
   * ゲーム中にAI ⇄ 人間を切り替える場合などに使用
   * @param controller - 新しいコントローラー
   */
  setController(controller: PlayerController): void {
    if (this.controller.dispose) {
      this.controller.dispose();
    }
    this.controller = controller;
  }

  /**
   * クリーンアップ処理
   */
  dispose(): void {
    if (this.controller.dispose) {
      this.controller.dispose();
    }
  }
}
