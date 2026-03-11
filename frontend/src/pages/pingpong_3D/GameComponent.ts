import type { Component } from "@/types/component";
import { t, word } from "@/i18n";
import { GameScreen } from "./object/GameScreen";
import { navigate } from "@/router";
import type { GamePhase } from "./core/game";
import { SliderLogic } from "@/components/banner-slider";

type ButtonUIElements = {
  overlay: HTMLElement | null;
  helpOverlay: HTMLElement | null;
  hud: {
    help: HTMLButtonElement | null;
    home: HTMLButtonElement | null;
    settings: HTMLButtonElement | null;
    pause: HTMLButtonElement | null;
    cameraReset: HTMLButtonElement | null;
  };
  menu: {
    resume: HTMLButtonElement | null;
    reset: HTMLButtonElement | null;
    settings: HTMLButtonElement | null;
    home: HTMLButtonElement | null;
    all: HTMLButtonElement[];
  };
};

type ButtonUIVisibility = {
  overlay: boolean;
  helpOverlay: boolean;
  menuButtons: boolean;
  hudNavButtons: boolean;
  hudGameButtons: boolean;
};

const HELP_SLIDES = [
  {
    image: "/howToPlay/page1.png",
    desc: t("htp_page1"),
  },
  {
    image: "/howToPlay/page2.png",
    desc: t("htp_page2"),
  },
  {
    image: "/howToPlay/page3.png",
    desc: t("htp_page3"),
  },
  {
    image: "/howToPlay/page4.png",
    desc: t("htp_page4"),
  },
];

export class GameComponent implements Component {
  private _appElm: HTMLElement;
  private _gameInstance!: GameScreen;
  private _rootElm!: HTMLElement;
  private _helpLogic: SliderLogic;
  private _uiElements: ButtonUIElements = {
    overlay: null,
    helpOverlay: null,
    hud: {
      help: null,
      home: null,
      settings: null,
      pause: null,
      cameraReset: null,
    },
    menu: {
      resume: null,
      reset: null,
      settings: null,
      home: null,
      all: [],
    },
  };

  constructor(appElm: HTMLElement) {
    this._appElm = appElm;
    this._helpLogic = new SliderLogic(HELP_SLIDES.length, {
      autoPlay: false,
      loop: false,
      onFinish: () => {
        this.closeHelpOverlay();
      },
      onChange: (index) => {
        this.updateHelpDOM(index);
      },
    });
  }

  render(): string {
    const slidesHtml = HELP_SLIDES.map(
      (slide, index) => `
      <div class="help-slide ${index === 0 ? "active" : ""}" data-index="${index}">
        <div class="help-slide-image">
          <img src="${slide.image}" alt="tutorial image">
        </div>
        <p class="help-slide-desc">${slide.desc}</p>
      </div>
    `,
    ).join("");

    const indicatorsHtml = HELP_SLIDES.map(
      (_, index) => `
      <div class="help-indicator ${index === 0 ? "active" : ""}" data-index="${index}"></div>
    `,
    ).join("");

    return `
            <div id="pingpong-3d-root">
                <div id="game-container-3d">
                    <canvas id="gameCanvas3D"></canvas>
                    <div id="pause-overlay"></div>
                    <div id="help-overlay">
                        <div class="help-content">
                            <div class="help-slider-container">
                                ${slidesHtml}
                                
                                <button class="help-nav prev-btn" id="help-prev">&#10094;</button>
                                <button class="help-nav next-btn" id="help-next">&#10095;</button>
                                
                                <div class="help-indicators">
                                    ${indicatorsHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="game-ui-3d">
                        <button id="btn-3d-help" title="${word("how_to_play")}">
                            <img src="/button/help.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-home-nav" title="${word("home")}">
                            <img src="/button/home.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-settings-nav" title="${word("settings")}">
                            <img src="/button/gear.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-pause" title="${word("pause")}">
                            <img src="/button/pause.svg" style="width: 24px; height: 24px;">
                        </button>
                        <button id="btn-3d-camera-reset" title="${word("camera_reset")}">
                            <img src="/button/camera.svg" style="width: 24px; height: 24px;">
                        </button>
                    </div>

                    <div id="central-menu-container">
                        <button id="btn-3d-resume" class="central-btn">
                            <img src="/button/resume.svg" style="width: 32px; height: 32px;">
                            <span>${t("resume")}</span>
                        </button>
                        <button id="btn-3d-reset" class="central-btn">
                            <img src="/button/reset.svg" style="width: 32px; height: 32px;">
                            <span>${t("reset")}</span>
                        </button>
                        <button id="btn-3d-settings" class="central-btn">
                            <img src="/button/gear.svg" style="width: 32px; height: 32px;">
                            <span>${t("settings")}</span>
                        </button>
                        <button id="btn-3d-home" class="central-btn">
                            <img src="/button/home.svg" style="width: 32px; height: 32px;">
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
    const root = this._appElm.querySelector<HTMLElement>("#pingpong-3d-root");
    if (!root) {
      throw new Error("root element not found");
    }
    this._rootElm = root;
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
    this.setupHelpSliderEvents();

    const handleHome = () => {
      this._gameInstance.stopGame();
      navigate("/");
    };
    const handleSettings = () => {
      this._gameInstance.stopGame();
      navigate("/pingpong_3D_config");
    };

    const { hud, menu } = this._uiElements;
    // SETTINGSボタン
    hud.settings?.addEventListener("click", handleSettings);
    menu.settings?.addEventListener("click", handleSettings);
    // HOMEボタン
    hud.home?.addEventListener("click", handleHome);
    menu.home?.addEventListener("click", handleHome);
    // PAUSEボタン
    hud.pause?.addEventListener("click", () => this._gameInstance.pauseGame());
    menu.resume?.addEventListener("click", () =>
      this._gameInstance.resumeGame(),
    );
    // RESETボタン
    menu.reset?.addEventListener("click", () => {
      if (this._gameInstance.gameState.resetLocked) return;
      this._gameInstance.resetGame();
    });
    // CAMERA RESETボタン
    hud.cameraReset?.addEventListener("click", () =>
      this._gameInstance.resetCamera(),
    );

    // ヘルプボタン
    hud.help?.addEventListener("click", () => {
      if (this._uiElements.helpOverlay) {
        this._uiElements.helpOverlay.style.display = "flex";
        this.updateUIButtons(
          this._gameInstance.gameState.phase,
          this._gameInstance.gameState.resetLocked,
        );
      }
    });

    // 背景クリック
    this._uiElements.helpOverlay?.addEventListener("click", (e) => {
      if (e.target === this._uiElements.helpOverlay) {
        this.closeHelpOverlay();
      }
    });
  }

  private setupHelpSliderEvents() {
    const prevBtn =
      this._rootElm.querySelector<HTMLButtonElement>("#help-prev");
    const nextBtn =
      this._rootElm.querySelector<HTMLButtonElement>("#help-next");
    const indicators = this._rootElm.querySelectorAll(".help-indicator");

    prevBtn?.addEventListener("click", () => this._helpLogic.prev());
    nextBtn?.addEventListener("click", () => this._helpLogic.next());

    indicators.forEach((ind) => {
      ind.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const index = Number(target.getAttribute("data-index"));
        this._helpLogic.goTo(index);
      });
    });

    this.updateHelpDOM(0);
  }

  private updateHelpDOM(index: number) {
    const slides = this._rootElm.querySelectorAll(".help-slide");
    const indicators = this._rootElm.querySelectorAll(".help-indicator");
    const prevBtn = this._rootElm.querySelector<HTMLElement>("#help-prev");

    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === index);
    });
    indicators.forEach((ind, idx) => {
      ind.classList.toggle("active", idx === index);
    });

    if (prevBtn) {
      prevBtn.style.visibility = this._helpLogic.isFirst()
        ? "hidden"
        : "visible";
    }
  }

  private closeHelpOverlay() {
    if (this._uiElements.helpOverlay) {
      this._uiElements.helpOverlay.style.display = "none";
      this._helpLogic.goTo(0);
      this.updateUIButtons(
        this._gameInstance.gameState.phase,
        this._gameInstance.gameState.resetLocked,
      );
    }
  }

  private initButtonUIElements() {
    this._uiElements.overlay = this._rootElm.querySelector("#pause-overlay");
    this._uiElements.helpOverlay = this._rootElm.querySelector("#help-overlay");
    this._uiElements.hud = {
      help: this._rootElm.querySelector("#btn-3d-help"),
      home: this._rootElm.querySelector("#btn-3d-home-nav"),
      settings: this._rootElm.querySelector("#btn-3d-settings-nav"),
      pause: this._rootElm.querySelector("#btn-3d-pause"),
      cameraReset: this._rootElm.querySelector("#btn-3d-camera-reset"),
    };

    this._uiElements.menu = {
      resume: this._rootElm.querySelector("#btn-3d-resume"),
      reset: this._rootElm.querySelector("#btn-3d-reset"),
      settings: this._rootElm.querySelector("#btn-3d-settings"),
      home: this._rootElm.querySelector("#btn-3d-home"),
      all: Array.from(
        this._rootElm.querySelectorAll<HTMLButtonElement>(".central-btn"),
      ),
    };
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
        menuButtons: false,
        hudNavButtons: false,
        hudGameButtons: false,
      };
    }

    // Phase別の設定
    switch (phase) {
      case "menu":
        return {
          overlay: false,
          helpOverlay: false,
          menuButtons: false,
          hudNavButtons: true,
          hudGameButtons: false,
        };
      case "game":
        return {
          overlay: false,
          helpOverlay: false,
          menuButtons: false,
          hudNavButtons: false,
          hudGameButtons: true,
        };
      case "pause":
        return {
          overlay: true,
          helpOverlay: false,
          menuButtons: true,
          hudNavButtons: false,
          hudGameButtons: false,
        };
      case "gameover":
      case "starting":
      default:
        return {
          overlay: false,
          helpOverlay: false,
          menuButtons: false,
          hudNavButtons: false,
          hudGameButtons: false,
        };
    }
  }

  /**
   * UI表示設定を実際のDOMに適用
   */
  private applyUIVisibility(visibility: ButtonUIVisibility) {
    const { overlay, helpOverlay, menuButtons, hudNavButtons, hudGameButtons } =
      visibility;
    const { hud, menu } = this._uiElements;

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

    menu.all.forEach((btn) => {
      btn.style.display = menuButtons ? "inline-flex" : "none";
    });

    // Nav buttons
    this.setButtonVisibility(hud.help, hudNavButtons);
    this.setButtonVisibility(hud.home, hudNavButtons);
    this.setButtonVisibility(hud.settings, hudNavButtons);

    // Game buttons
    this.setButtonVisibility(hud.pause, hudGameButtons);
    this.setButtonVisibility(
      hud.cameraReset,
      hudGameButtons || this._gameInstance.gameState.phase === "pause",
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
    const { reset } = this._uiElements.menu;
    if (reset) {
      reset.disabled = resetLocked;
      reset.classList.toggle("btn-disabled", resetLocked);
    }
  }

  onUnmount() {
    this._appElm.classList.remove("no-overflow");
    document.body.classList.remove("game-body");
    this._gameInstance.stopGame();
    this._helpLogic.stop();
  }
}
