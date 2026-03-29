import type { PaddleInput } from "../object/Paddle";
import type { KeyboardHandlers } from "./key";

export class InputManager {
  private isSetup = false;
  private keysPressed: Record<string, boolean> = {};
  private handlers: KeyboardHandlers;
  private pointerTarget: HTMLCanvasElement | null = null;
  /** メニュー画面のときだけ true（GameScreen が毎フレーム同期） */
  private tapToStartAccepting = false;
  private tapToStartPending = false;
  private virtualP1Up = false;
  private virtualP1Down = false;
  private virtualP2Up = false;
  private virtualP2Down = false;

  constructor(handlers: KeyboardHandlers) {
    this.handlers = handlers;
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

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (!this.tapToStartAccepting) return;
    this.tapToStartPending = true;
  };

  setup(canvas: HTMLCanvasElement) {
    if (this.isSetup) return;
    this.isSetup = true;
    this.pointerTarget = canvas;

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("resize", this.handleResize);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
  }

  cleanup() {
    if (!this.isSetup) return;
    this.isSetup = false;

    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("resize", this.handleResize);
    if (this.pointerTarget) {
      this.pointerTarget.removeEventListener("pointerdown", this.handlePointerDown);
      this.pointerTarget = null;
    }

    this.tapToStartAccepting = false;
    this.tapToStartPending = false;
    this.virtualP1Up = false;
    this.virtualP1Down = false;
    this.virtualP2Up = false;
    this.virtualP2Down = false;
    Object.keys(this.keysPressed).forEach((k) => (this.keysPressed[k] = false));
  }

  setVirtualP1Up(pressed: boolean) {
    this.virtualP1Up = pressed;
  }

  setVirtualP1Down(pressed: boolean) {
    this.virtualP1Down = pressed;
  }

  setVirtualP2Up(pressed: boolean) {
    this.virtualP2Up = pressed;
  }

  setVirtualP2Down(pressed: boolean) {
    this.virtualP2Down = pressed;
  }

  /**
   * メニュー中のみタップで開始を受け付ける。オフにすると未消費のタップも破棄する。
   * （プレイ中のクリックがメニュー復帰後に誤ってスタートしないようにする）
   */
  setTapToStartAccepting(enabled: boolean) {
    this.tapToStartAccepting = enabled;
    if (!enabled) {
      this.tapToStartPending = false;
    }
  }

  /** メニュー「タップで開始」用。呼ぶとフラグは false に戻る（1 回だけ有効）。 */
  consumeTapToStart(): boolean {
    const v = this.tapToStartPending;
    this.tapToStartPending = false;
    return v;
  }

  getPaddleInputs(): { p1: PaddleInput; p2: PaddleInput } {
    return {
      p1: {
        up: !!this.keysPressed["w"] || this.virtualP1Up,
        down: !!this.keysPressed["s"] || this.virtualP1Down,
      },
      p2: {
        up: !!this.keysPressed["ArrowUp"] || this.virtualP2Up,
        down: !!this.keysPressed["ArrowDown"] || this.virtualP2Down,
      },
    };
  }

  isEnterPressed(): boolean {
    return this.keysPressed["Enter"] === true;
  }
}
