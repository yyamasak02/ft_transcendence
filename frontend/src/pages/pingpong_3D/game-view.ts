// pingpong_3D/game-view.ts ゲーム画面のHTML

import type { Component } from "@/types/component";
import "./style.css";

export class PingPong3DGameView implements Component {
	render(): string {
		return `
			<div id="pingpong-3d-root">
				<div id="game-container-3d">
					<canvas id="gameCanvas3D"></canvas>

					<div id="game-ui-3d">
						<button id="btn-3d-home">Home</button>
						<button id="btn-3d-settings">Settings</button>
						<button id="btn-3d-pause">Pause</button>
						<button id="btn-3d-resume">Resume</button>
						<button id="btn-3d-reset">Reset</button>
						<button id="btn-3d-camera-reset"> Camera Reset</button>
					</div>
				</div>
			</div>
		`;
	}
}