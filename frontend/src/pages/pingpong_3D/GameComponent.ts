import type { Component } from "@/types/component";
import { t, word } from "@/i18n";
import { GameScreen } from "./object/GameScreen";
import { navigate } from "@/router";

export class GameComponent implements Component {
  private _appElm: HTMLElement;
  private _navElm: HTMLElement;
  private _gameInstance!: GameScreen;
  private _rootElm!: HTMLElement;

  constructor(appElm: HTMLElement, navElm: HTMLElement) {
    this._appElm = appElm;
    this._navElm = navElm;
  }

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
                            <img src="../../public/button/help.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-home-nav" title="${word("home")}">
                            <img src="../../public/button/home.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-settings-nav" title="${word("settings")}">
                            <img src="../../public/button/gear.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-pause" title="${word("pause")}">
                            <img src="../../public/button/pause.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-camera-reset" title="${word("camera_reset")}">
                            <img src="../../public/button/camera.svg" style="width: 24px; height: 24px;">
                        </button>
                    </div>

                    <div id="central-menu-container">
                        <button id="btn-3d-resume" class="central-btn">
                            <img src="../../public/button/resume.svg" style="width: 32px; height: 32px;">
                            <span>${t("resume")}</span>
                        </button>
                        <button id="btn-3d-reset" class="central-btn">
                            <img src="../../public/button/reset.svg" style="width: 32px; height: 32px;">
                            <span>${t("reset")}</span>
                        </button>
                        <button id="btn-3d-settings" class="central-btn">
                            <img src="../../public/button/gear.svg" style="width: 32px; height: 32px;">
                            <span>${t("settings")}</span>
                        </button>
                        <button id="btn-3d-home" class="central-btn">
                            <img src="../../public/button/home.svg" style="width: 32px; height: 32px;">
                            <span>${t("home")}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
  }
  onMount() {
    this._appElm.classList.add("no-overflow");
    document.body.classList.add("game-body");
    this._navElm.style.display = "none";
    const root = this._appElm.querySelector<HTMLElement>("#pingpong-3d-root");
    if (!root) {
      throw new Error("root element not found");
    }
    this._rootElm = root;
    // SETTINGSボタン
    const btnSettingsNav = this._rootElm.querySelector("#btn-3d-settings-nav");
    const btnSettingsCentral = this._rootElm.querySelector("#btn-3d-settings");
    // HOMEボタン
    const homeButton = this._rootElm.querySelector("#btn-3d-home");
    const homeButtonNav = this._rootElm.querySelector("#btn-3d-home-nav");
    // PAUSEボタン
    const pauseButton = this._rootElm.querySelector("#btn-3d-pause");
    // RESUMEボタン
    const resumeButton = this._rootElm.querySelector("#btn-3d-resume");
    // RESETボタン
    const resetButton = this._rootElm.querySelector("#btn-3d-reset");
    // CAMERA RESETボタン
    const cameraResetButton = this._rootElm.querySelector(
      "#btn-3d-camera-reset",
    );
    // HELP BUTTON
    const btnHelp = this._rootElm.querySelector<HTMLElement>("#btn-3d-help");
    // HELP OVERLAY ELEMENT
    const helpOverlay =
      this._rootElm.querySelector<HTMLElement>("#help-overlay");
    // HELP CLOSE
    const btnCloseHelp =
      this._rootElm.querySelector<HTMLElement>("#btn-close-help");
    if (
      !btnSettingsNav ||
      !btnSettingsCentral ||
      !homeButton ||
      !homeButtonNav ||
      !pauseButton ||
      !resumeButton ||
      !resetButton ||
      !cameraResetButton
    ) {
      throw new Error("some button elements are missing");
    }
    if (!btnHelp || !helpOverlay || !btnCloseHelp) {
      throw new Error("some help elements are missing");
    }

    // ゲーム初期化
    const canvas =
      this._rootElm.querySelector<HTMLCanvasElement>("#gameCanvas3D");
    if (!canvas) {
      throw new Error("Canvas element #gameCanvas3D not found");
    }
    this._gameInstance = new GameScreen(canvas, this._rootElm);
    this._gameInstance.stopGame();
    this._gameInstance.startGame();

    const handleHome = () => {
      this._gameInstance.stopGame();
      navigate("/");
    };
    const handleSettings = () => {
      this._gameInstance.stopGame();
      navigate("/pingpong_3D_config");
    };
    // SETTINGSボタン
    btnSettingsNav.addEventListener("click", handleSettings);
    btnSettingsCentral.addEventListener("click", handleSettings);
    // HOMEボタン
    homeButtonNav.addEventListener("click", handleHome);
    homeButton.addEventListener("click", handleHome);
    // PAUSEボタン
    pauseButton.addEventListener("click", () => this._gameInstance.pauseGame());
    // RESUMEボタン
    resumeButton.addEventListener("click", () =>
      this._gameInstance.resumeGame(),
    );
    // RESETボタン
    resetButton.addEventListener("click", () => {
      if (this._gameInstance.gameState.resetLocked) return;
      this._gameInstance.resetGame();
    });
    // CAMERA RESETボタン
    cameraResetButton.addEventListener("click", () =>
      this._gameInstance.resetCamera(),
    );

    btnHelp.addEventListener(
      "click",
      () => (helpOverlay.style.display = "flex"),
    );
    btnCloseHelp.addEventListener(
      "click",
      () => (helpOverlay.style.display = "none"),
    );
    helpOverlay.addEventListener("click", (e) => {
      if (e.target === helpOverlay) {
        helpOverlay.style.display = "none";
      }
    });
  }
  onUnmount() {
    this._appElm.classList.remove("no-overflow");
    document.body.classList.remove("game-body");
    this._navElm.style.display = "flex";
    this._gameInstance.stopGame();
  }
}
