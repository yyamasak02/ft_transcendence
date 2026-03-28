import type { PaddleInput } from "../object/Paddle";
import type { KeyboardHandlers } from "./key";

export class InputManager {
  private isSetup = false;
  private keysPressed: Record<string, boolean> = {};
  private handlers: KeyboardHandlers;
  private pointerTarget: HTMLCanvasElement | null = null;
  private tapToStartPending = false;

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

    this.tapToStartPending = false;
    Object.keys(this.keysPressed).forEach((k) => (this.keysPressed[k] = false));
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
        up: !!this.keysPressed["w"],
        down: !!this.keysPressed["s"],
      },
      p2: {
        up: !!this.keysPressed["ArrowUp"],
        down: !!this.keysPressed["ArrowDown"],
      },
    };
  }

  isEnterPressed(): boolean {
    return this.keysPressed["Enter"] === true;
  }
}
