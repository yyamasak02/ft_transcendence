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

                    <div id="help-overlay">
                        <div class="help-content">
                            <h2>HOW TO PLAY</h2>

                            <div class="help-section victory">
                                <span class="label">GOAL</span>
                                <p class="victory-text">First to <span class="highlight">Win Points</span> Wins!</p>
                            </div>

                            <div class="help-grid">
                                <div class="help-card">
                                    <div class="icon-area">
                                        <div class="key-group">
                                            <div class="key">W</div>
                                            <div class="key">S</div>
                                        </div>
                                        <span class="or">or</span>
                                        <div class="key-group">
                                            <div class="key">↑</div>
                                            <div class="key">↓</div>
                                        </div>
                                    </div>
                                    <h3>PADDLE CONTROL</h3>
                                    <p>Move Up & Down</p>
                                </div>

                                <div class="help-card">
                                    <div class="icon-area">
                                        <img src="/mouse-drag.svg" class="mouse-icon" alt="Mouse" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                                        <span class="fallback-icon">🖱️ + ↔️</span>
                                    </div>
                                    <h3>CAMERA VIEW</h3>
                                    <p>Drag to Rotate</p>
                                </div>
                            </div>

                            <div class="help-footer">
                                <div class="tool-item">
                                    <img src="/pause.svg" class="mini-icon">
                                    <span>Pause Game</span>
                                </div>
                                <div class="tool-item">
                                    <img src="/camera.svg" class="mini-icon">
                                    <span>Reset Camera</span>
                                </div>
                            </div>

                            <button id="btn-close-help" class="central-btn small">
                                <span>CLOSE</span>
                            </button>
                        </div>
                    </div>
                    <div id="game-ui-3d">
                        <button id="btn-3d-help" title="${word("how_to_play")}">
                            <img src="/help.svg" style="width: 24px; height: 24px;">
                        </button>
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
