// pingpong_3D/index.ts　ルーティングと設定画面
import type { Routes } from "@/types/routes";
import * as PingPong3DGame from "./game-main";
import { PingPong3DGameView } from "./game-view";
import { navigate } from "@/router/router";
import "./style.css";

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
			
			// ゲーム最初期化
			PingPong3DGame.stopGame();
			PingPong3DGame.startGame();
			
			const gameRoot = document.getElementById("pingpong-3d-root") as HTMLElement | null;
			if (!gameRoot) {
				console.error("pingpong-3d-root not found");
				return;
			}

			// ボタン取得
			const btnHome = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-home");
			const btnSettings = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-settings");
			const btnPause = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-pause");
			const btnResume = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-resume");
			const btnReset = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-reset");
			const btnCameraReset = gameRoot.querySelector<HTMLButtonElement>("#btn-3d-camera-reset");
			
			btnHome?.addEventListener("click", () => {
				PingPong3DGame.stopGame();
				navigate("/");
			});
			btnSettings?.addEventListener("click", () => {
				PingPong3DGame.stopGame();
				navigate("/pingpong_3D_config");
			});
			btnPause?.addEventListener("click", () => {
				PingPong3DGame.pauseGame();
			});
			btnResume?.addEventListener("click", () => {
				PingPong3DGame.resumeGame();
			});
			btnReset?.addEventListener("click", () => {
				PingPong3DGame.resetGame();
			})
			btnCameraReset?.addEventListener("click", () => {
				PingPong3DGame.resetCamera();
			})
		},
		onUnmount: () => {
			document.body.classList.remove("game-body");
			const nav = document.getElementById("nav");
			if (nav) nav.style.display = "flex";
			PingPong3DGame.stopGame();
		},
		head: { title: "Ping Pong 3D" }
	},
};
