// pingpong_3D/game-view.ts ゲーム画面のHTML
import type { Component } from "@/types/component";

import { word, t } from "@/i18n";

export class PingPong3DGameView implements Component {
  render(): string {
    return `
			<div id="pingpong-3d-root">
				<div id="game-container-3d">
					<canvas id="gameCanvas3D"></canvas>

					<div id="game-ui-3d">
						<button id="btn-3d-home">${t("home")}</button>
						<button id="btn-3d-settings">${t("settings")}</button>
						<button id="btn-3d-pause">${t("pause")}</button>
						<button id="btn-3d-resume">${t("resume")}</button>
						<button id="btn-3d-reset">${t("reset")}</button>
						<button id="btn-3d-camera-reset">${t("camera_reset")}</button>
					</div>
				</div>
			</div>
		`;
  }
}
