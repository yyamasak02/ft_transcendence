import type { Component } from "@/types/component";
import { t, word } from "@/i18n";
import { GameScreen } from "./object/GameScreen";
import { navigate } from "@/router";
import type { GamePhase } from "./core/game";

type ButtonUIElements = {
  overlay: HTMLElement | null;
  helpOverlay: HTMLElement | null;
  buttons: {
    help: HTMLButtonElement | null;
    homeNav: HTMLButtonElement | null;
    settingsNav: HTMLButtonElement | null;
    pause: HTMLButtonElement | null;
    cameraReset: HTMLButtonElement | null;
    reset: HTMLButtonElement | null;
  };
  centralButtons: HTMLButtonElement[];
};

type ButtonUIVisibility = {
  overlay: boolean;
  helpOverlay: boolean;
  centralButtons: boolean;
  navButtons: boolean;
  gameButtons: boolean;
};

export class GameComponent implements Component {
  private _appElm: HTMLElement;
  private _navElm: HTMLElement;
  private _gameInstance!: GameScreen;
  private _rootElm!: HTMLElement;
  private _uiElements: ButtonUIElements = {
    overlay: null,
    helpOverlay: null,
    buttons: {
      help: null,
      homeNav: null,
      settingsNav: null,
      pause: null,
      cameraReset: null,
      reset: null,
    },
    centralButtons: [],
  };

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

    this.initButtonUIElements();

    // ゲーム初期化（phaseChangeコールバックを渡す）
    const canvas =
      this._rootElm.querySelector<HTMLCanvasElement>("#gameCanvas3D");
    if (!canvas) {
      throw new Error("Canvas element #gameCanvas3D not found");
    }
    this._gameInstance = new GameScreen(canvas, (phase, resetLocked) => {
      this.updateUIButtons(phase, resetLocked);
    });
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

    btnHelp.addEventListener("click", () => {
      helpOverlay.style.display = "flex";
      this.updateUIButtons(
        this._gameInstance.gameState.phase,
        this._gameInstance.gameState.resetLocked,
      );
    });
    btnCloseHelp.addEventListener("click", () => {
      helpOverlay.style.display = "none";
      this.updateUIButtons(
        this._gameInstance.gameState.phase,
        this._gameInstance.gameState.resetLocked,
      );
    });
    helpOverlay.addEventListener("click", (e) => {
      if (e.target === helpOverlay) {
        helpOverlay.style.display = "none";
        this.updateUIButtons(
          this._gameInstance.gameState.phase,
          this._gameInstance.gameState.resetLocked,
        );
      }
    });
  }

  // ------------------------
  // ボタン要素初期化
  // ------------------------
  private initButtonUIElements() {
    this._uiElements.overlay = this._rootElm.querySelector("#pause-overlay");
    this._uiElements.helpOverlay = this._rootElm.querySelector("#help-overlay");
    this._uiElements.buttons.help = this._rootElm.querySelector("#btn-3d-help");
    this._uiElements.buttons.homeNav =
      this._rootElm.querySelector("#btn-3d-home-nav");
    this._uiElements.buttons.settingsNav = this._rootElm.querySelector(
      "#btn-3d-settings-nav",
    );
    this._uiElements.buttons.pause =
      this._rootElm.querySelector("#btn-3d-pause");
    this._uiElements.buttons.cameraReset = this._rootElm.querySelector(
      "#btn-3d-camera-reset",
    );
    this._uiElements.buttons.reset =
      this._rootElm.querySelector("#btn-3d-reset");
    this._uiElements.centralButtons = Array.from(
      this._rootElm.querySelectorAll<HTMLButtonElement>(".central-btn"),
    );
  }

  // ------------------------
  // button更新（phase変更時にGameScreenから呼ばれる）
  // ------------------------
  private updateUIButtons(phase: GamePhase, resetLocked: boolean) {
    const isHelpVisible =
      this._uiElements.helpOverlay?.style.display === "flex";

    // Phase別UI状態の取得
    const visibility = this.getUIVisibility(phase, isHelpVisible);

    // UI状態を適用
    this.applyUIVisibility(visibility);

    // Resetボタンの特別処理
    this.updateResetButtonState(resetLocked);
  }

  /**
   * 現在のphaseとヘルプ表示状態からUI表示設定を取得
   */
  private getUIVisibility(
    phase: GamePhase,
    isHelpVisible: boolean,
  ): ButtonUIVisibility {
    // ヘルプ表示中はナビボタンを隠す
    if (isHelpVisible) {
      return {
        overlay: false,
        helpOverlay: true,
        centralButtons: false,
        navButtons: false,
        gameButtons: false,
      };
    }

    // Phase別の設定
    switch (phase) {
      case "menu":
        return {
          overlay: false,
          helpOverlay: false,
          centralButtons: false,
          navButtons: true,
          gameButtons: false,
        };
      case "game":
        return {
          overlay: false,
          helpOverlay: false,
          centralButtons: false,
          navButtons: false,
          gameButtons: true,
        };
      case "pause":
        return {
          overlay: true,
          helpOverlay: false,
          centralButtons: true,
          navButtons: false,
          gameButtons: false,
        };
      case "gameover":
      case "starting":
      default:
        return {
          overlay: false,
          helpOverlay: false,
          centralButtons: false,
          navButtons: false,
          gameButtons: false,
        };
    }
  }

  /**
   * UI表示設定を実際のDOMに適用
   */
  private applyUIVisibility(visibility: ButtonUIVisibility) {
    const { overlay, helpOverlay, centralButtons, navButtons, gameButtons } =
      visibility;
    const { buttons } = this._uiElements;

    // Overlay
    if (this._uiElements.overlay) {
      this._uiElements.overlay.style.display = overlay ? "block" : "none";
    }

    // Help Overlay
    if (this._uiElements.helpOverlay) {
      this._uiElements.helpOverlay.style.display = helpOverlay
        ? "flex"
        : "none";
    }

    // Central buttons
    this._uiElements.centralButtons.forEach((btn) => {
      btn.style.display = centralButtons ? "inline-flex" : "none";
    });

    // Nav buttons
    this.setButtonVisibility(buttons.help, navButtons);
    this.setButtonVisibility(buttons.homeNav, navButtons);
    this.setButtonVisibility(buttons.settingsNav, navButtons);

    // Game buttons
    this.setButtonVisibility(buttons.pause, gameButtons);
    this.setButtonVisibility(
      buttons.cameraReset,
      gameButtons || this._gameInstance.gameState.phase === "pause",
    );
  }

  /**
   * ボタンの表示/非表示を設定
   */
  private setButtonVisibility(
    button: HTMLButtonElement | null,
    visible: boolean,
  ) {
    if (button) {
      button.style.display = visible ? "inline-flex" : "none";
    }
  }

  /**
   * Resetボタンの状態を更新
   */
  private updateResetButtonState(resetLocked: boolean) {
    const { reset } = this._uiElements.buttons;
    if (reset) {
      reset.disabled = resetLocked;
      reset.classList.toggle("btn-disabled", resetLocked);
    }
  }

  onUnmount() {
    this._appElm.classList.remove("no-overflow");
    document.body.classList.remove("game-body");
    this._navElm.style.display = "flex";
    this._gameInstance.stopGame();
  }
}
