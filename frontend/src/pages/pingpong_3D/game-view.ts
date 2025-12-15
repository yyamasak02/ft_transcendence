// pingpong_3D/game-view.ts ゲーム画面のHTML
import type { Component } from "@/types/component";
import "./style.css";
import { word } from "@/i18n";

export class PingPong3DGameView implements Component {
	render(): string {
		return `
			<div id="pingpong-3d-root">
				<div id="game-container-3d">
					<canvas id="gameCanvas3D"></canvas>

					<div id="game-ui-3d">
						<button id="btn-3d-home">${word("home")}</button>
						<button id="btn-3d-settings">${word("settings")}</button>
						<button id="btn-3d-pause">${word("pause")}</button>
						<button id="btn-3d-resume">${word("resume")}</button>
						<button id="btn-3d-reset">${word("reset")}</button>
						<button id="btn-3d-camera-reset">${word("camera_reset")}</button>
					</div>
				</div>
			</div>
		`;
	}
}