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
			<div class="pp-config">
				<h2>Ping Pong 3D Settings</h2>

				<div class="pp-config-row">
					<label>Winning Score:</label>
					<input id="winning-score" type="number" min="1" max="20" value="5" />
				</div>

				<div class="pp-config-row">
					<label>Ball Speed:</label>
					<input id="ball-speed" type="range" min="10" max="100" step="10" value="50" />
				</div>
				
				<div class="pp-config-row">
					<label>Countdown (ms):</label>
					<input id="countdown-interval" type="number" min="200" max="2000" value="1000" />
				</div>
				
				<div class="pp-config-row">
					<label>Stage:</label>
					<select id="stage-select">
						<option value="0">Classic Court</option>
						<option value="1">Shadow Court</option>
						<option value="2">Warp Court</option>
					</select>
				</div>

				<div class="pp-config-row">
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

				<div class="pp-config-row">
					<label>-------- Length: </label>
					<input id="paddle1-length" type="range" min="1" max="10" step="1" value="8" />
				</div>

				<div class="pp-config-row">
					<label>Paddle 2 Color: </label>
					<select id="paddle2-color">
						<option value="blue">Blue</option>
						<option value="green">Green</option>
						<option value="red">Red</option>
						<option value="yellow">Yellow</option>
						<option value="white">White</option>
						<option value="black">Black</option>
						<option value="pink">Pink</option>
					</select>
				</div>

				<div class="pp-config-row">
					<label>-------- Length: </label>
					<input id="paddle2-length" type="range" min="1" max="10" step="1" value="8" />
				</div>

				<div class="pp-preview-container">
					<canvas id="previewCanvas3D"></canvas>
				</div>

				<div class="pp-config-row">
					<button id="pingpong-start-btn">Start Game</button>
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

			const startBtn = document.getElementById("pingpong-start-btn");

			const previewCanvas = document.getElementById("previewCanvas3D") as HTMLCanvasElement;
			preview = new PreviewScene(previewCanvas);

			const updatePreview = () => {
				const p1Len = Number((document.getElementById("paddle1-length") as HTMLInputElement).value);
				const p1Col = (document.getElementById("paddle1-color") as HTMLSelectElement).value;
				const p2Len = Number((document.getElementById("paddle2-length") as HTMLInputElement).value);
				const p2Col = (document.getElementById("paddle2-color") as HTMLSelectElement).value;
				const stageIdx = Number((document.getElementById("stage-select") as HTMLSelectElement).value);
				preview!.updatePreview(p1Len, p1Col, p2Len, p2Col, stageIdx);
			};
		
			document.getElementById("paddle1-length")?.addEventListener("input", updatePreview);
			document.getElementById("paddle1-color")?.addEventListener("change", updatePreview);
			document.getElementById("paddle2-length")?.addEventListener("input", updatePreview);
			document.getElementById("paddle2-color")?.addEventListener("change", updatePreview);
			document.getElementById("stage-select")?.addEventListener("change", updatePreview);
		
			updatePreview();
			
			if (!startBtn) return;
			startBtn.addEventListener("click", () => {
				// 設定値を取る
				const winningScore = Number((document.getElementById("winning-score") as HTMLInputElement).value);
				const ballSpeed = Number((document.getElementById("ball-speed") as HTMLInputElement).value);
				const countdown = Number((document.getElementById("countdown-interval") as HTMLInputElement).value);
				const stage = Number((document.getElementById("stage-select") as HTMLInputElement).value);
				const p1Lenth = Number((document.getElementById("paddle1-length") as HTMLInputElement).value);
				const p1Color = ((document.getElementById("paddle1-color") as HTMLInputElement).value);
				const p2Lenth = Number((document.getElementById("paddle2-length") as HTMLInputElement).value);
				const p2Color = ((document.getElementById("paddle2-color") as HTMLInputElement).value);
				
				// グローバル値を書き換える
				setWinningScore(winningScore);
				setBallSpeed(ballSpeed);
				setCountdownInterval(countdown);
				gameData.selectedStageIndex = stage;
				
				gameData.paddles.player1.length = p1Lenth;
				gameData.paddles.player1.color = p1Color;
				gameData.paddles.player2.length = p2Lenth;
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
			document.getElementById("nav")!.style.display = "none";
			
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
			document.getElementById("nav")!.style.display = "flex";
			stopPingPongGame();
		},
		head: { title: "Ping Pong 3D" }
	},
};
