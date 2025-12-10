// pingpong_3D/input/keyboard.ts
import { engine } from "../core/data";
import type { PaddleInput } from "../object/Paddle";

const keysPressed: Record<string, boolean> = {};
let isSetup = false;

export function setupKeyboardListener() {
	if (isSetup) return;

	isSetup = true;
	document.addEventListener("keydown", (e) => {
		keysPressed[e.key] = true;
	});

	document.addEventListener("keyup", (e) => {
		keysPressed[e.key] = false;
	});
	
	// スマホ用画面のリサイズ
	window.addEventListener("resize", () => {
		engine.resize();
	});
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
