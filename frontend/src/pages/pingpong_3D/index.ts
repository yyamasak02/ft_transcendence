// pingpong_3D/index.ts　ルーティングと設定画面
import type { Component } from "@/types/component";
import type { Routes } from "@/types/routes";
import { startPingPongGame, stopPingPongGame } from "./game-main";
import { PingPong3DGameView } from "./game-view";
import { navigate } from "@/router/router";
import "./style.css";
import { setBallSpeed, setCountdownInterval, setWinningScore } from "./core/constants3D";
import { gameData } from "./core/data";
import { PreviewScene } from "./object/preview/PreviewScene";

let preview: PreviewScene | null = null;

// ゲーム設定画面
class PingPongComponent implements Component {
	render(): string {
		return `
			<div id="pp3d-config-root" class="pp3d-config">
				<div class="pp3d-config">
					<h2>Ping Pong 3D Settings</h2>

					<div class="pp3d-config-row">
						<label>Winning Score:</label>
						<input id="winning-score" type="number" min="1" max="20" value="5" />
					</div>

					<div class="pp3d-config-row">
						<label>Ball Speed:</label>
						<input id="ball-speed" type="range" min="10" max="100" step="10" value="50" />
					</div>
					
					<div class="pp3d-config-row">
						<label>Countdown (ms):</label>
						<input id="countdown-interval" type="number" min="200" max="2000" value="1000" />
					</div>
					
					<div class="pp3d-config-row">
						<label>Stage:</label>
						<select id="stage-select">
							<option value="0">Classic Court</option>
							<option value="1">Shadow Court</option>
							<option value="2">Warp Court</option>
						</select>
					</div>

					<div class="pp3d-config-row">
						<label>Paddle 1 Color: </label>
						<select id="paddle1-color">
							<option value="blue">Blue</option>
							<option value="green">Green</option>
							<option value="red">Red</option>
							<option value="yellow">Yellow</option>
							<option value="white">White</option>
							<option value="black">Black</option>
							<option value="pink">Pink</option>
						</select>
					</div>

					<div class="pp3d-config-row">
						<label>-------- Length: </label>
						<input id="paddle1-length" type="range" min="1" max="10" step="1" value="8" />
					</div>

					<div class="pp3d-config-row">
						<label>Paddle 2 Color: </label>
						<select id="paddle2-color">
							<option value="green">Green</option>
							<option value="blue">Blue</option>
							<option value="red">Red</option>
							<option value="yellow">Yellow</option>
							<option value="white">White</option>
							<option value="black">Black</option>
							<option value="pink">Pink</option>
						</select>
					</div>

					<div class="pp3d-config-row">
						<label>-------- Length: </label>
						<input id="paddle2-length" type="range" min="1" max="10" step="1" value="8" />
					</div>

					<div class="pp-preview-container">
						<canvas id="previewCanvas3D"></canvas>
					</div>

					<div class="pp3d-config-row">
						<button id="pingpong-start-btn">Start Game</button>
					</div>

				</div>
			</div>
		`;
	}
}

const pingPong3DSettingComponent = new PingPongComponent();

export const PingPong3DSettingRoute: Routes = {
  "/pingpong_3D_config": {
    linkLabel: "Setting PingPong 3D",
    content: pingPong3DSettingComponent.render(),
    onMount: () => {
			document.body.classList.add("pingpong-page");
			document.body.classList.add("overflow-hidden");
			document.documentElement.classList.add("overflow-hidden");

			const pp3dConfigRoot = document.getElementById("pp3d-config-root") as HTMLElement;

			const startBtn = pp3dConfigRoot.querySelector<HTMLButtonElement>("#pingpong-start-btn");
			const previewCanvas = pp3dConfigRoot.querySelector<HTMLCanvasElement>("#previewCanvas3D");

			if (!previewCanvas) {
				console.error("previewCanvas3D not found");
				return;	
			}
			preview = new PreviewScene(previewCanvas);

			const updatePreview = () => {
				const p1Len = Number((pp3dConfigRoot.querySelector<HTMLInputElement>("#paddle1-length")!).value);
				const p1Col = (pp3dConfigRoot.querySelector<HTMLSelectElement>("#paddle1-color")!).value;
				const p2Len = Number((pp3dConfigRoot.querySelector<HTMLInputElement>("#paddle2-length")!).value);
				const p2Col = (pp3dConfigRoot.querySelector<HTMLSelectElement>("#paddle2-color")!).value;
				const stageIdx = Number((pp3dConfigRoot.querySelector<HTMLSelectElement>("#stage-select")!).value);

				preview!.updatePreview(p1Len, p1Col, p2Len, p2Col, stageIdx);
			};
		
			const p1LenInput = pp3dConfigRoot.querySelector<HTMLInputElement>("#paddle1-length");
			const p1ColSelect = pp3dConfigRoot.querySelector<HTMLSelectElement>("#paddle1-color");
			const p2LenInput = pp3dConfigRoot.querySelector<HTMLInputElement>("#paddle2-length");
			const p2ColSelect = pp3dConfigRoot.querySelector<HTMLSelectElement>("#paddle2-color");
			const stageSelect = pp3dConfigRoot.querySelector<HTMLSelectElement>("#stage-select");

			p1LenInput?.addEventListener("input", updatePreview);
			p1ColSelect?.addEventListener("change", updatePreview);
			p2LenInput?.addEventListener("input", updatePreview);
			p2ColSelect?.addEventListener("change", updatePreview);
			stageSelect?.addEventListener("change", updatePreview);
			updatePreview();
			
			if (!startBtn) return;
			startBtn.addEventListener("click", () => {

				const winningScore = Number((pp3dConfigRoot.querySelector<HTMLInputElement>("#winning-score")!).value);
				const ballSpeed = Number((pp3dConfigRoot.querySelector<HTMLInputElement>("#ball-speed")!).value);
				const countdown = Number((pp3dConfigRoot.querySelector<HTMLInputElement>("#countdown-interval")!).value);
				const stage = Number((pp3dConfigRoot.querySelector<HTMLSelectElement>("#stage-select")!).value);
				const p1Length = Number((pp3dConfigRoot.querySelector<HTMLInputElement>("#paddle1-length")!).value);
				const p1Color = ((pp3dConfigRoot.querySelector<HTMLSelectElement>("#paddle1-color")!).value);
				const p2Length = Number((pp3dConfigRoot.querySelector<HTMLInputElement>("#paddle2-length")!).value);
				const p2Color = ((pp3dConfigRoot.querySelector<HTMLSelectElement>("#paddle2-color")!).value);

				// グローバル値を書き換える
				setWinningScore(winningScore);
				setBallSpeed(ballSpeed);
				setCountdownInterval(countdown);
				gameData.selectedStageIndex = stage;
				
				gameData.paddles.player1.length = p1Length;
				gameData.paddles.player1.color = p1Color;
				gameData.paddles.player2.length = p2Length;
				gameData.paddles.player2.color = p2Color;

				// ゲーム開始
				navigate("/pingpong_3D");
			});
    },
    onUnmount: () => {
      document.body.classList.remove("pingpong-page");
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
    },
    head: {
      title: "Ping Pong Game 3D Settings",
    },
  },
};

const gameView = new PingPong3DGameView();

export const PingPong3DGameRoute: Routes = {
	"/pingpong_3D": {
		linkLabel: "PingPong 3D Play",
		content: gameView.render(),
		onMount: () => {
			const app = document.getElementById("app");
			if (app) app.classList.add("no-overflow");
			document.body.classList.add("game-body");
			const nav = document.getElementById("nav");
			if (nav) nav.style.display = "none";
			
			stopPingPongGame();
			startPingPongGame();
			
			const btnHome = document.getElementById("btn-3d-home");
			const btnSettings = document.getElementById("btn-3d-settings");
			if (btnHome) {
				btnHome.addEventListener("click", () => {
					stopPingPongGame();
					navigate("/");
				});
			}
			if (btnSettings) {
				btnSettings.addEventListener("click", () => {
					stopPingPongGame();
					navigate("/pingpong_3D_config");
				});
			}
		},
		onUnmount: () => {
			document.body.classList.remove("game-body");
			const nav = document.getElementById("nav");
			if (nav) nav.style.display = "flex";
			stopPingPongGame();
		},
		head: { title: "Ping Pong 3D" }
	},
};
