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
                    <div id="pause-overlay"></div>

                    <div id="game-ui-3d">
                        <button id="btn-3d-home-nav" title="${word("home")}">
                            <img src="/home.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-settings-nav" title="${word("settings")}">
                            <img src="/gear.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-pause" title="${word("pause")}">
                            <img src="/pause.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-camera-reset" title="${word("camera_reset")}">
                            <img src="/camera.svg" style="width: 24px; height: 24px;">
                        </button>
                    </div>

                    <div id="central-menu-container">
                        <button id="btn-3d-resume" class="central-btn">
                            <img src="/resume.svg" style="width: 32px; height: 32px;">
                            <span>${word("resume")}</span>
                        </button>
                        <button id="btn-3d-reset" class="central-btn">
                            <img src="/reset.svg" style="width: 32px; height: 32px;">
                            <span>${word("reset")}</span>
                        </button>
                        <button id="btn-3d-settings" class="central-btn">
                            <img src="/gear.svg" style="width: 32px; height: 32px;">
                            <span>${word("settings")}</span>
                        </button>
                        <button id="btn-3d-home" class="central-btn">
                            <img src="/home.svg" style="width: 32px; height: 32px;">
                            <span>${word("home")}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
  }
}
