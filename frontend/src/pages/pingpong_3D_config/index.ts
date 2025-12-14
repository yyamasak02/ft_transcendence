// pingpong_3D_config/index.ts ルーティングと設定画面
import type { Component } from "@/types/component";
import type { Routes } from "@/types/routes";
import { navigate } from "@/router/router";
import "./style.css";
import { saveSettings } from "../pingpong_3D/core/gameSettings";
import { PreviewScene } from "../pingpong_3D/object/preview/PreviewScene";

let preview: PreviewScene | null = null;

// ゲーム設定画面
class PingPongComponent implements Component {
	render(): string {
		return `
			<div id="pp3d-config-root" class="pp3d-config">
				<div class="pp3d-config">
					<h2>Ping Pong 3D Settings</h2>

					<div class="pp3d-config-row">
						<label>Score to Win:</label>
						<input id="winning-score" type="number" min="1" max="20" value="5" />
					</div>

					<div class="pp3d-config-row">
						<label>Ball Speed:</label>
						<input id="ball-speed" type="range" min="10" max="100" step="10" value="50" />
					</div>
					
				<div class="pp3d-config-row">
					<label>CountSpeed:</label>
					<select id="countdown-interval">
						<option value="500">fast (✕2)</option>
						<option value="1000" selected>normal</option>
						<option value="2000">slow (✕0.5)</option>
					</select>
				</div>
					
					<div class="pp3d-config-row">
						<label>Stage:</label>
						<select id="stage-select">
							<option value="0">Classic Court</option>
							<option value="1">Shadow Court</option>
							<option value="2">Warp Court</option>
						</select>
					</div>

					<div class="pp3d-config-row pp3d-inline-row">
							<label class="pp3d-label">Player 1 Color: </label>
							<select id="paddle1-color" class="pp3d-color-select">
								<option value="blue">Blue</option>
								<option value="green">Green</option>
								<option value="red">Red</option>
								<option value="yellow">Yellow</option>
								<option value="white">White</option>
								<option value="black">Black</option>
								<option value="pink">Pink</option>
							</select>

							<div class="pp3d-length-group">
								<label class="pp3d-sub-label">Paddle Length: </label>
								<input id="paddle1-length" type="range" min="1" max="10" step="1" value="8" />
							</div>
						</div>

						<div class="pp3d-config-row pp3d-inline-row">
							<label class="pp3d-label">Paddle 2 Color: </label>
							<select id="paddle2-color" class="pp3d-color-select">
								<option value="green">Green</option>
								<option value="blue">Blue</option>
								<option value="red">Red</option>
								<option value="yellow">Yellow</option>
								<option value="white">White</option>
								<option value="black">Black</option>
								<option value="pink">Pink</option>
							</select>

							<div class="pp3d-length-group">
								<label class="pp3d-sub-label">Paddle Length: </label>
								<input id="paddle2-length" type="range" min="1" max="10" step="1" value="8" />
							</div>
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

			// 入力要素の参照を取る
			const winningScoreInput	= pp3dConfigRoot.querySelector<HTMLInputElement>("#winning-score");
			const ballSpeedInput		= pp3dConfigRoot.querySelector<HTMLInputElement>("#ball-speed");
			const countdownSelect		= pp3dConfigRoot.querySelector<HTMLSelectElement>("#countdown-interval");
			const stageSelect				= pp3dConfigRoot.querySelector<HTMLSelectElement>("#stage-select");

			const p1LenInput				= pp3dConfigRoot.querySelector<HTMLInputElement>("#paddle1-length");
			const p1ColSelect				= pp3dConfigRoot.querySelector<HTMLSelectElement>("#paddle1-color");
			const p2LenInput				= pp3dConfigRoot.querySelector<HTMLInputElement>("#paddle2-length");
			const p2ColSelect				= pp3dConfigRoot.querySelector<HTMLSelectElement>("#paddle2-color");

			// プレビュー更新関数
			const updatePreview = () => {
				if (!preview || !p1LenInput || !p1ColSelect || !p2LenInput || !p2ColSelect || !stageSelect) return;

				const p1Len			= Number(p1LenInput.value);
				const p1Col			= p1ColSelect.value;
				const p2Len			= Number(p2LenInput.value);
				const p2Col			= p2ColSelect.value;
				const stageIdx	= Number(stageSelect.value);
				preview.updatePreview(p1Len, p1Col, p2Len, p2Col, stageIdx);
			};

			// 入力更新時にプレビューを更新する
			p1LenInput?.addEventListener("input", updatePreview);
			p1ColSelect?.addEventListener("change", updatePreview);
			p2LenInput?.addEventListener("input", updatePreview);
			p2ColSelect?.addEventListener("change", updatePreview);
			stageSelect?.addEventListener("change", updatePreview);
			
			// 初期表示
			updatePreview();
			
			// Game Start ボタンが押された時
			if (!startBtn) return;
			startBtn.addEventListener("click", () => {
				if (!winningScoreInput || !ballSpeedInput || !countdownSelect || !stageSelect ||
						!p1LenInput || !p1ColSelect || !p2LenInput || !p2ColSelect) return;

				// Start Game が押された時の設定値を受け取る
				const winningScore	= Number(winningScoreInput.value);
				const ballSpeed			= Number(ballSpeedInput.value);
				const countdown			= Number(countdownSelect.value);
				const stage					= Number(stageSelect.value);
				const p1Length			= Number(p1LenInput.value);
				const p1Color				= p1ColSelect.value;
				const p2Length			= Number(p2LenInput.value);
				const p2Color				= p2ColSelect.value;

				// 入力値を読み取る
				saveSettings({
					winningScore,
					ballSpeed,
					selectedCountdownSpeed: countdown,
					selectedStageIndex: stage,
					player1Color: p1Color,
					player1Length: p1Length,
					player2Color: p2Color,
					player2Length: p2Length
					});

				// ゲーム開始
				navigate("/pingpong_3D");
			});
    },
    onUnmount: () => {
			if (preview) {
				preview.dispose();
				preview = null;
			}
      document.body.classList.remove("pingpong-page");
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
    },
    head: {
      title: "Ping Pong Game 3D Settings",
    },
  },
};
