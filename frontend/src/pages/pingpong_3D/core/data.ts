// src/core/data.ts
import { Engine, Scene} from "@babylonjs/core";

export let canvas: HTMLCanvasElement;
export let engine: Engine;
export let scene: Scene;

// ページにDOMが描画された後に呼んで初期化する
export function initDOMRefs() {
  canvas = document.getElementById("gameCanvas3D") as HTMLCanvasElement;

  if (!canvas) {
    throw new Error("Canvas element #gameCanvas3D not found");
  }

	engine = new Engine(canvas, true);
  scene = new Scene(engine);
  window.addEventListener("resize", () => { engine.resize(); });
}

// gameData
export const gameData = {
	selectedCountdownSpeed: 0,
  player1CharIndex: 0,
  player2CharIndex: 0,
  selectedStageIndex: 0,
	paddles: {
		player1: { score: 0, length: 8, color: "#00ff00" },
		player2: { score: 0, length: 8, color: "#ff0000" }
	},
  keysPressed: {} as { [key: string]: boolean },
};
