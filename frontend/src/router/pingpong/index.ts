import type { Component } from "@/models/component";
import type { Route } from "@/models/routes";
import { startPingPongGame } from "@/tobaba";
import "./styles.css";

class PingPongComponent implements Component {
  render = (): string => {
    return `
    <div class="game-container">
        <div class="ui-panel left-panel">
            <div id="p1-using-gauge-container" class="using-gauge-container"></div>
            <div id="p1-stamina-gauge-container" class="stamina-gauge-container">
                <div id="p1-stamina-fill" class="stamina-gauge-fill"></div>
            </div>
        </div>
        <div id="p1-char-image" class="char-image-container left-char-image">
            <img id="p1-char-img" src="" alt="Player 1 Character">
        </div>

        <canvas id="gameCanvas" width="800" height="600"></canvas>

        <div class="ui-panel right-panel">
            <div id="p2-using-gauge-container" class="using-gauge-container"></div>
            <div id="p2-stamina-gauge-container" class="stamina-gauge-container">
                <div id="p2-stamina-fill" class="stamina-gauge-fill"></div>
            </div>
        </div>
        <div id="p2-char-image" class="char-image-container right-char-image">
            <img id="p2-char-img" src="" alt="Player 2 Character">
        </div>
    </div>
    `;
  };
}

import type { Routes } from "@/models/routes";

const pingPongComponent = new PingPongComponent();

export const PingPongRoute: Routes = {
  "/pingpong": {
    linkLabel: "Ping Pong",
    content: pingPongComponent.render(),
    onMount: () => {
      console.log("Ping Pong page mounted");
      document.body.classList.add("pingpong-page");
      startPingPongGame();
    },
    onUnmount: () => {
      document.body.classList.remove("pingpong-page");
    },
    head: {
      title: "Ping Pong Game",
    },
  },
};
