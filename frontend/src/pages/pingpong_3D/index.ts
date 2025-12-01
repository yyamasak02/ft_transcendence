// pingpong_3D/index.ts

import type { Component } from "@/models/component";
import type { Routes } from "@/models/routes";
import { startPingPongGame } from "./game-main";
import { PingPong3DGameView } from "./game-view";
import { navigate } from "@/router/router";
import "./style.css";

// ゲーム設定画面
class PingPongComponent implements Component {
	render(): string {
		return `
			<div class="pp-config">
				<h2>Ping Pong 3D Settings</h2>

				<button id="pingpong-start-btn">Start Game</button>
			</div>
		`;
	}
}

const pingPongComponent = new PingPongComponent();

export const PingPong3DRoute: Routes = {
  "/pingpong_3D_config": {
    linkLabel: "Ping Pong 3D",
    content: pingPongComponent.render(),
    onMount: () => {
      console.log("Ping Pong 3D page mounted");
			document.body.classList.add("pingpong-page");
			document.body.classList.add("overflow-hidden");
			document.documentElement.classList.add("overflow-hidden");

			const startBtn = document.getElementById("pingpong-start-btn");
			if (startBtn) {
				startBtn.addEventListener("click", () => {
					// ゲーム開始
					navigate("/pingpong_3D");
				});
			} else {
				console.error("Start button not found");
			}
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
		linkLabel: "Ping Pong 3D Play",
		content: gameView.render(),
		onMount: () => {
			startPingPongGame();
		},
		head: { title: "Ping Pong 3D" }
	},
};
