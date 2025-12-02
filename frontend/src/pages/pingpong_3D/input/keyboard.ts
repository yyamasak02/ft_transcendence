// pingpong_3D/input/keyboard.ts
import { gameData, engine } from "../core/data";
import type { PaddleInput } from "../object/Paddle";

export function setupKeyboardListener() {
	document.addEventListener("keydown", (e) => {
		gameData.keysPressed[e.key] = true;
	});

	document.addEventListener("keyup", (e) => {
		gameData.keysPressed[e.key] = false;
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
			up: gameData.keysPressed["w"],
			down: gameData.keysPressed["s"],
		},
		p2: {
			up: gameData.keysPressed["ArrowUp"],
			down: gameData.keysPressed["ArrowDown"],
		},
	};
}
