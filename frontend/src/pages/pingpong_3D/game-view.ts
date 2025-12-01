// pingpong_3D/game-view.ts
import type { Component } from "@/models/component";
import "./style.css";

export class PingPong3DGameView implements Component {
	render(): string {
		return `
			<div class="game-container">
				<canvas id="gameCanvas3D"></canvas>
			</div>
		`;
	}
}