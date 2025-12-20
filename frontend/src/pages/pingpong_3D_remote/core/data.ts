// src/core/data.ts
/**
 * ゲーム全体で共有する Babylon の実行コンテキスト。
 * 設定値ではなく、DOM 初期化後に生成されるオブジェクトへの参照を持つ。
 */
import { Engine, Scene } from "@babylonjs/core";

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
}
