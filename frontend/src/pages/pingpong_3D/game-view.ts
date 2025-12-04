// pingpong_3D/game-view.ts ゲーム画面のHTML

import type { Component } from "@/types/component";
import "./style.css";

export class PingPong3DGameView implements Component {
	render(): string {
		return `
			<div class="game-container">
				<canvas id="gameCanvas3D"></canvas>
				<div id="game-ui-3d">
					<button id="btn-3d-home">Home</button>
					<button id="btn-3d-settings">Settings</button>
				</div>
			</div>
		`;
	}
}