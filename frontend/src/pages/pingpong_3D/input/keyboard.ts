// pingpong_3D/input/keyboard.ts
import { engine } from "../core/data";
import type { PaddleInput } from "../object/Paddle";

const keysPressed: Record<string, boolean> = {};
let isSetup = false;

function handleKeyDown(e: KeyboardEvent) {
  keysPressed[e.key] = true;
}
function handleKeyUp(e: KeyboardEvent) {
  keysPressed[e.key] = false;
}
function handleResize() {
  engine.resize();
}

// 初期化
export function setupKeyboardListener() {
  if (isSetup) return;
  isSetup = true;

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  window.addEventListener("resize", handleResize);
}

// cleanup
export function cleanupKeyboardListener() {
  if (!isSetup) return;
  isSetup = false;

  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("keyup", handleKeyUp);
  document.removeEventListener("resize", handleResize);

  // キー状態リセット
  Object.keys(keysPressed).forEach((k) => (keysPressed[k] = false));
}

// paddle移動
export function getPaddleInputs(): { p1: PaddleInput; p2: PaddleInput } {
  return {
    p1: {
      up: keysPressed["w"],
      down: keysPressed["s"],
    },
    p2: {
      up: keysPressed["ArrowUp"],
      down: keysPressed["ArrowDown"],
    },
  };
}

export function isEnterPressed(): boolean {
  return keysPressed["Enter"] === true;
}
