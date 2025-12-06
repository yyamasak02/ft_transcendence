// pingpong_3D/index.ts　ルーティングと設定画面
import type { Routes } from "@/types/routes";
import { startPingPongGame, stopPingPongGame } from "./game-main";
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
