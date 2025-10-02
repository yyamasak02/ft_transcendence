import type { Component } from "@/models/component";
import type { Routes } from "@/models/routes";
import { startPingPongGame } from "./game-main";

class PingPongComponent implements Component {
  render = (): string => {
    return `
    <div class="relative w-screen flex items-center justify-center bg-black">
        <!-- Left Panel -->
        <div class="left-panel ui-panel absolute top-[20%] left-[5%] hidden flex-row items-start gap-[20%] z-10">
            <div id="p1-using-gauge-container" class="flex flex-col items-center min-w-[8em] mx-2"></div>
            <div id="p1-stamina-gauge-container" class="stamina-gauge-container w-[6vw] min-w-[60px] h-[30vh] border-[0.5vw] border-white flex flex-col-reverse mx-[2vw]">
                <div id="p1-stamina-fill" class="stamina-gauge-fill w-full transition-[height] duration-200"></div>
            </div>
        </div>

        <!-- Left Character Image -->
        <div id="p1-char-image" class="char-image-container absolute bottom-10 left-10 w-[20vw] min-w-[200px] h-[20vw] min-h-[200px] border-4 border-white hidden justify-center items-end bg-black/70 z-[5]">
            <img id="p1-char-img" src="" alt="Player 1 Character" class="w-full h-full object-contain">
        </div>

        <!-- Canvas -->
        <canvas id="gameCanvas" width="800" height="600"
                class="border-4 border-white cursor-none w-[60vw] h-[75vh] max-w-full max-h-screen box-border bg-black block"></canvas>

        <!-- Right Panel -->
        <div class="right-panel ui-panel absolute top-[20%] right-[2%] hidden flex-row items-start gap-[20%] z-10">
            <div id="p2-stamina-gauge-container" class="stamina-gauge-container w-[6vw] min-w-[60px] h-[30vh] border-[0.5vw] border-white flex flex-col-reverse mx-[2vw]">
                <div id="p2-stamina-fill" class="stamina-gauge-fill w-full transition-[height] duration-200"></div>
            </div>
            <div id="p2-using-gauge-container" class="flex flex-col items-center min-w-[8em] mx-2"></div>
        </div>

        <!-- Right Character Image -->
        <div id="p2-char-image" class="char-image-container absolute bottom-10 right-10 w-[20vw] min-w-[200px] h-[20vw] min-h-[200px] border-4 border-white hidden justify-center items-end bg-black/70 z-[5]">
            <img id="p2-char-img" src="" alt="Player 2 Character" class="w-full h-full object-contain">
        </div>
    </div>
    `;
  };
}

const pingPongComponent = new PingPongComponent();

export const PingPongRoute: Routes = {
  "/pingpong": {
    linkLabel: "Ping Pong",
    content: pingPongComponent.render(),
    onMount: () => {
      console.log("Ping Pong page mounted");
      document.body.classList.add("pingpong-page");
      // スクロール防止
      document.body.classList.add("overflow-hidden");
      document.documentElement.classList.add("overflow-hidden");
      startPingPongGame();
    },
    onUnmount: () => {
      document.body.classList.remove("pingpong-page");
      // スクロール復元
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
    },
    head: {
      title: "Ping Pong Game",
    },
  },
};
