import type { PaddleInput } from "../object/Paddle";
import type { KeyboardHandlers } from "./key";

export class InputManager {
  private isSetup = false;
  private keysPressed: Record<string, boolean> = {};
  private handlers: KeyboardHandlers;

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

    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("resize", this.handleResize);

    Object.keys(this.keysPressed).forEach((k) => (this.keysPressed[k] = false));
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
