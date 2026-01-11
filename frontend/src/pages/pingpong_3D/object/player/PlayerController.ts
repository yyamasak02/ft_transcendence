// object/player/PlayerController.ts
import type { Ball } from "../Ball";
import type { Paddle, PaddleInput } from "../Paddle";

/**
 * プレイヤーコントローラーのインターフェース
 * 入力ソース（人間、AI、ネットワーク）を抽象化します
 */
export interface PlayerController {
  /**
   * パドルの入力を取得
   * @param ball - ボールオブジェクト（AI判断に使用）
   * @param paddle - 制御対象のパドル
   * @returns パドルの入力（上下移動）
   */
  getInput(ball: Ball, paddle: Paddle): PaddleInput;

  /**
   * クリーンアップ処理（オプション）
   */
  dispose?(): void;
}
