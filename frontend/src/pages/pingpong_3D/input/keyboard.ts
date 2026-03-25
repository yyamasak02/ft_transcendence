import type { PaddleInput } from "../object/Paddle";
import type { KeyboardHandlers } from "./key";
import { GAME_CONFIG } from "../core/constants3D";

/** タッチの横移動をコート上のZに変換（画面幅いっぱいのドラッグ ≒ プレイ可能Z幅） */
function touchDxToDeltaZ(dx: number, canvasWidthPx: number): number {
  const w = Math.max(canvasWidthPx, 1);
  const playableZ = GAME_CONFIG.COURT_HEIGHT - 4;
  // 左にドラッグ → z 減少（従来の「上」）、右 → z 増加（「下」）
  return (dx / w) * playableZ;
}

export class InputManager {
  private isSetup = false;
  private keysPressed: Record<string, boolean> = {};
  private handlers: KeyboardHandlers;

  /** ローカル対戦（2人とも人間）時:
   *  画面上半分ドラッグで「上のラケット」(P2)、下半分で「下のラケット」(P1)
   *  ドラッグ方向（左右）を Paddle の up/down に変換する
   */
  private localTwoPlayerTouchEnabled = false;
  private touchCanvas: HTMLCanvasElement | null = null;
  /** 同一フレーム内に積むタッチ由来のZ変位（getPaddleInputs で読み取り後にリセット） */
  private touchAccumZ = { p1: 0, p2: 0 };
  private pointerById = new Map<
    number,
    { side: "p1" | "p2"; lastX: number }
  >();

  /** HumanController が同一フレーム内で2回 getPaddleInputs を呼ぶため、1フレーム1回だけ合成する */
  private paddleInputsCache: { p1: PaddleInput; p2: PaddleInput } | null =
    null;

  constructor(handlers: KeyboardHandlers) {
    this.handlers = handlers;
  }

  /** gameLoop 先頭で呼ぶ（入力スナップショットを更新する） */
  beginInputFrame(): void {
    this.paddleInputsCache = null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.touchCanvas) return;
    const rect = this.touchCanvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // 画面上の「上/下」と3D上のP1/P2の対応（真上カメラの見え方に合わせる）
    const side = y < rect.height / 2 ? "p2" : "p1";
    this.pointerById.set(e.pointerId, { side, lastX: e.clientX });
    try {
      this.touchCanvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    const st = this.pointerById.get(e.pointerId);
    if (!st || !this.touchCanvas) return;
    const dx = e.clientX - st.lastX;
    st.lastX = e.clientX;
    if (dx === 0) return;
    const rect = this.touchCanvas.getBoundingClientRect();
    const dz = touchDxToDeltaZ(dx, rect.width);
    if (st.side === "p1") {
      this.touchAccumZ.p1 += dz;
    } else {
      this.touchAccumZ.p2 += dz;
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.pointerById.delete(e.pointerId);
    if (this.touchCanvas) {
      try {
        this.touchCanvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  /**
   * ローカル対戦（2人とも人間）かつモバイル想定で有効化。
   * キャンバス上のドラッグでパドル移動（カメラ操作は Stage 側で無効化すること）。
   */
  enableLocalTwoPlayerTouch(canvas: HTMLCanvasElement): void {
    this.disableLocalTwoPlayerTouch();
    this.localTwoPlayerTouchEnabled = true;
    this.touchCanvas = canvas;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
  }

  disableLocalTwoPlayerTouch(): void {
    if (!this.touchCanvas) {
      this.localTwoPlayerTouchEnabled = false;
      return;
    }
    this.touchCanvas.removeEventListener("pointerdown", this.onPointerDown);
    this.touchCanvas.removeEventListener("pointermove", this.onPointerMove);
    this.touchCanvas.removeEventListener("pointerup", this.onPointerUp);
    this.touchCanvas.removeEventListener("pointercancel", this.onPointerUp);
    this.touchCanvas = null;
    this.localTwoPlayerTouchEnabled = false;
    this.pointerById.clear();
    this.touchAccumZ = { p1: 0, p2: 0 };
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.key] = true;
    this.handlers.onKeyDown?.(this.keysPressed);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.key] = false;
    this.handlers.onKeyUp?.(this.keysPressed);
  };

  private handleResize = () => {
    this.handlers.onResize?.();
  };

  setup() {
    if (this.isSetup) return;
    this.isSetup = true;

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("resize", this.handleResize);
  }

  cleanup() {
    if (!this.isSetup) return;
    this.isSetup = false;

    this.disableLocalTwoPlayerTouch();

    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("resize", this.handleResize);

    Object.keys(this.keysPressed).forEach((k) => (this.keysPressed[k] = false));
  }

  getPaddleInputs(): { p1: PaddleInput; p2: PaddleInput } {
    if (this.paddleInputsCache) {
      return this.paddleInputsCache;
    }

    const kbP1: PaddleInput = {
      up: !!this.keysPressed["w"],
      down: !!this.keysPressed["s"],
    };
    const kbP2: PaddleInput = {
      up: !!this.keysPressed["ArrowUp"],
      down: !!this.keysPressed["ArrowDown"],
    };

    if (!this.localTwoPlayerTouchEnabled) {
      this.paddleInputsCache = { p1: kbP1, p2: kbP2 };
      return this.paddleInputsCache;
    }

    const tz1 = this.touchAccumZ.p1;
    const tz2 = this.touchAccumZ.p2;
    this.touchAccumZ = { p1: 0, p2: 0 };

    const merged = {
      p1: {
        up: kbP1.up,
        down: kbP1.down,
        ...(tz1 !== 0 ? { touchDeltaZ: tz1 } : {}),
      },
      p2: {
        up: kbP2.up,
        down: kbP2.down,
        ...(tz2 !== 0 ? { touchDeltaZ: tz2 } : {}),
      },
    };
    this.paddleInputsCache = merged;
    return merged;
  }

  isEnterPressed(): boolean {
    return this.keysPressed["Enter"] === true;
  }
}
