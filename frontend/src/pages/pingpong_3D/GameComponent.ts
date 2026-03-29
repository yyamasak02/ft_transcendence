import type { Component } from "@/types/component";
import { t, word } from "@/i18n";
import { GameScreen } from "./object/GameScreen";
import { navigate } from "@/router";
import type { GamePhase } from "./core/game";
import { SliderLogic } from "@/components/banner-slider";
import { renderHelpOverlay } from "./HelpOverlay";
import { HELP_SLIDES } from "./helpSlider";

type ButtonUIElements = {
  overlay: HTMLElement | null;
  helpOverlay: HTMLElement | null;
  paddleTouch: HTMLElement | null;
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

export class GameComponent implements Component {
  private _appElm: HTMLElement;
  private _gameInstance!: GameScreen;
  private _rootElm!: HTMLElement;
  private _helpLogic: SliderLogic;
  private _detachPaddleTouch: (() => void) | null = null;
  private _uiElements: ButtonUIElements = {
    overlay: null,
    helpOverlay: null,
    paddleTouch: null,
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

    return `
            <div id="pingpong-3d-root">
                <div id="game-container-3d" class="relative h-[100dvh] min-h-[100dvh] w-screen max-w-full overflow-hidden">
                    <canvas id="gameCanvas3D" class="pointer-events-auto relative z-[9999] box-border block h-full max-h-full w-full max-w-full cursor-default touch-none border-none bg-transparent"></canvas>
                    <div id="pause-overlay" class="pointer-events-none fixed inset-0 z-[10000] hidden h-[100dvh] w-screen bg-black/60 backdrop-blur-[5px]"></div>
                        ${renderHelpOverlay()}
                    <div id="game-ui-3d" class="absolute right-2 top-2 z-[10000] flex max-w-[calc(100vw-1rem)] flex-wrap justify-end gap-1.5 sm:right-5 sm:top-5 sm:gap-2.5">
                        <button type="button" id="btn-3d-help" class="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-[#f77001] text-white transition-all duration-200 ease-out hover:scale-105 hover:bg-[#ff8c33] hover:shadow-[0_0_15px_rgba(247,112,1,0.4)] sm:h-11 sm:w-11" title="${word("how_to_play")}">
                            <img src="/button/help.svg" class="pointer-events-none h-5 w-5 brightness-0 invert sm:h-6 sm:w-6" alt="">
                        </button>
                        <button type="button" id="btn-3d-home-nav" class="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-[#f77001] text-white transition-all duration-200 ease-out hover:scale-105 hover:bg-[#ff8c33] hover:shadow-[0_0_15px_rgba(247,112,1,0.4)] sm:h-11 sm:w-11" title="${word("home")}">
                            <img src="/button/home.svg" class="pointer-events-none h-5 w-5 brightness-0 invert sm:h-6 sm:w-6" alt="">
                        </button>
                        <button type="button" id="btn-3d-settings-nav" class="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-[#f77001] text-white transition-all duration-200 ease-out hover:scale-105 hover:bg-[#ff8c33] hover:shadow-[0_0_15px_rgba(247,112,1,0.4)] sm:h-11 sm:w-11" title="${word("settings")}">
                            <img src="/button/gear.svg" class="pointer-events-none h-5 w-5 brightness-0 invert sm:h-6 sm:w-6" alt="">
                        </button>
                        <button type="button" id="btn-3d-pause" class="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-[#f77001] text-white transition-all duration-200 ease-out hover:scale-105 hover:bg-[#ff8c33] hover:shadow-[0_0_15px_rgba(247,112,1,0.4)] sm:h-11 sm:w-11" title="${word("pause")}">
                            <img src="/button/pause.svg" class="pointer-events-none h-5 w-5 brightness-0 invert sm:h-6 sm:w-6" alt="">
                        </button>
                        <button type="button" id="btn-3d-camera-reset" class="hidden max-sm:!hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-[#f77001] text-white transition-all duration-200 ease-out hover:scale-105 hover:bg-[#ff8c33] hover:shadow-[0_0_15px_rgba(247,112,1,0.4)] sm:h-11 sm:w-11" title="${word("camera_reset")}">
                            <img src="/button/camera.svg" class="pointer-events-none h-5 w-5 brightness-0 invert sm:h-6 sm:w-6" alt="">
                        </button>
                    </div>

                    <div id="central-menu-container" class="pointer-events-none absolute left-1/2 top-1/2 z-[10001] flex w-[min(100%,340px)] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 sm:gap-5">
                        <button type="button" id="btn-3d-resume" data-central-btn class="pointer-events-auto hidden min-h-[60px] w-full cursor-pointer items-center justify-start gap-3 rounded-[14px] border-none bg-[#f77001] pl-10 text-base uppercase tracking-wide text-white shadow-[0_8px_0_#b35100] transition-all duration-100 ease-out hover:-translate-y-0.5 hover:bg-[#ff8c33] hover:pl-12 hover:shadow-[0_10px_0_#b35100] active:translate-y-1.5 active:shadow-[0_2px_0_#b35100] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-30 disabled:shadow-none disabled:grayscale disabled:pointer-events-none sm:h-[75px] sm:gap-5 sm:pl-[60px] sm:text-[1.8rem] sm:tracking-[2px] sm:hover:pl-[65px]">
                            <img src="/button/resume.svg" class="pointer-events-none h-7 w-7 brightness-0 invert sm:h-8 sm:w-8" alt="">
                            <span class="mt-1">${t("resume")}</span>
                        </button>
                        <button type="button" id="btn-3d-reset" data-central-btn class="pointer-events-auto hidden min-h-[60px] w-full cursor-pointer items-center justify-start gap-3 rounded-[14px] border-none bg-[#f77001] pl-10 text-base uppercase tracking-wide text-white shadow-[0_8px_0_#b35100] transition-all duration-100 ease-out hover:-translate-y-0.5 hover:bg-[#ff8c33] hover:pl-12 hover:shadow-[0_10px_0_#b35100] active:translate-y-1.5 active:shadow-[0_2px_0_#b35100] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-30 disabled:shadow-none disabled:grayscale disabled:pointer-events-none sm:h-[75px] sm:gap-5 sm:pl-[60px] sm:text-[1.8rem] sm:tracking-[2px] sm:hover:pl-[65px]">
                            <img src="/button/reset.svg" class="pointer-events-none h-7 w-7 brightness-0 invert sm:h-8 sm:w-8" alt="">
                            <span class="mt-1">${t("reset")}</span>
                        </button>
                        <button type="button" id="btn-3d-settings" data-central-btn class="pointer-events-auto hidden min-h-[60px] w-full cursor-pointer items-center justify-start gap-3 rounded-[14px] border-none bg-[#f77001] pl-10 text-base uppercase tracking-wide text-white shadow-[0_8px_0_#b35100] transition-all duration-100 ease-out hover:-translate-y-0.5 hover:bg-[#ff8c33] hover:pl-12 hover:shadow-[0_10px_0_#b35100] active:translate-y-1.5 active:shadow-[0_2px_0_#b35100] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-30 disabled:shadow-none disabled:grayscale disabled:pointer-events-none sm:h-[75px] sm:gap-5 sm:pl-[60px] sm:text-[1.8rem] sm:tracking-[2px] sm:hover:pl-[65px]">
                            <img src="/button/gear.svg" class="pointer-events-none h-7 w-7 brightness-0 invert sm:h-8 sm:w-8" alt="">
                            <span class="mt-1">${t("settings")}</span>
                        </button>
                        <button type="button" id="btn-3d-home" data-central-btn class="pointer-events-auto hidden min-h-[60px] w-full cursor-pointer items-center justify-start gap-3 rounded-[14px] border-none bg-[#f77001] pl-10 text-base uppercase tracking-wide text-white shadow-[0_8px_0_#b35100] transition-all duration-100 ease-out hover:-translate-y-0.5 hover:bg-[#ff8c33] hover:pl-12 hover:shadow-[0_10px_0_#b35100] active:translate-y-1.5 active:shadow-[0_2px_0_#b35100] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-30 disabled:shadow-none disabled:grayscale disabled:pointer-events-none sm:h-[75px] sm:gap-5 sm:pl-[60px] sm:text-[1.8rem] sm:tracking-[2px] sm:hover:pl-[65px]">
                            <img src="/button/home.svg" class="pointer-events-none h-7 w-7 brightness-0 invert sm:h-8 sm:w-8" alt="">
                            <span class="mt-1">${t("home")}</span>
                        </button>
                    </div>

                    <div id="paddle-touch-controls" class="pointer-events-none absolute inset-0 z-[10002] hidden md:hidden">
                        <div class="pointer-events-auto absolute left-2 top-[5.5rem] sm:left-4 sm:top-28">
                            <button type="button" data-paddle-touch="p1-down" class="flex h-12 w-12 touch-manipulation select-none items-center justify-center rounded-xl border border-white/20 bg-[#f77001]/90 text-lg text-white shadow-[0_4px_0_#b35100] transition-transform active:translate-y-0.5 active:shadow-[0_2px_0_#b35100] sm:h-14 sm:w-14 sm:text-xl" aria-label="Player 1 down" title="P1 ↓">◀︎</button>
                        </div>
                        <div class="pointer-events-auto absolute bottom-20 left-2 sm:bottom-24 sm:left-4">
                            <button type="button" data-paddle-touch="p2-down" class="flex h-12 w-12 touch-manipulation select-none items-center justify-center rounded-xl border border-white/20 bg-[#f77001]/90 text-lg text-white shadow-[0_4px_0_#b35100] transition-transform active:translate-y-0.5 active:shadow-[0_2px_0_#b35100] sm:h-14 sm:w-14 sm:text-xl" aria-label="Player 2 down" title="P2 ↓">◀︎</button>
                        </div>
                        <div class="pointer-events-auto absolute right-2 top-[5.5rem] sm:right-4 sm:top-28">
                            <button type="button" data-paddle-touch="p1-up" class="flex h-12 w-12 touch-manipulation select-none items-center justify-center rounded-xl border border-white/20 bg-[#f77001]/90 text-lg text-white shadow-[0_4px_0_#b35100] transition-transform active:translate-y-0.5 active:shadow-[0_2px_0_#b35100] sm:h-14 sm:w-14 sm:text-xl" aria-label="Player 1 up" title="P1 ↑">▶︎</button>
                        </div>
                        <div class="pointer-events-auto absolute bottom-20 right-2 sm:bottom-24 sm:right-4">
                            <button type="button" data-paddle-touch="p2-up" class="flex h-12 w-12 touch-manipulation select-none items-center justify-center rounded-xl border border-white/20 bg-[#f77001]/90 text-lg text-white shadow-[0_4px_0_#b35100] transition-transform active:translate-y-0.5 active:shadow-[0_2px_0_#b35100] sm:h-14 sm:w-14 sm:text-xl" aria-label="Player 2 up" title="P2 ↑">▶︎</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  onMount() {
    this._appElm.classList.add("overflow-hidden");
    document.body.classList.add(
      "bg-black",
      "text-white",
      "h-screen",
      "overflow-hidden",
      "m-0",
      "font-['Bebas_Neue',sans-serif]",
    );
    const root = this._appElm.querySelector<HTMLElement>("#pingpong-3d-root");
    if (!root) {
      throw new Error("root element not found");
    }
    this._rootElm = root;
    this.initButtonUIElements();

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
    this.setupPaddleTouchControls();

    const handleHome = () => {
      this._gameInstance.stopGame();
      navigate("/");
    };
    const handleSettings = () => {
      this._gameInstance.stopGame();
      navigate("/pingpong_3D_config");
    };

    const { hud, menu } = this._uiElements;
    hud.settings?.addEventListener("click", handleSettings);
    menu.settings?.addEventListener("click", handleSettings);
    hud.home?.addEventListener("click", handleHome);
    menu.home?.addEventListener("click", handleHome);
    hud.pause?.addEventListener("click", () => this._gameInstance.pauseGame());
    menu.resume?.addEventListener("click", () =>
      this._gameInstance.resumeGame(),
    );
    menu.reset?.addEventListener("click", () => {
      if (this._gameInstance.gameState.resetLocked) return;
      this._gameInstance.resetGame();
    });
    hud.cameraReset?.addEventListener("click", () =>
      this._gameInstance.resetCamera(),
    );

    hud.help?.addEventListener("click", () => {
      if (this._uiElements.helpOverlay) {
        this._uiElements.helpOverlay.classList.remove("hidden");
        this._uiElements.helpOverlay.classList.add("flex");
        this.updateUIButtons(
          this._gameInstance.gameState.phase,
          this._gameInstance.gameState.resetLocked,
        );
      }
    });

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
      prevBtn.classList.toggle("invisible", this._helpLogic.isFirst());
      prevBtn.classList.toggle("visible", !this._helpLogic.isFirst());
    }
  }

  private closeHelpOverlay() {
    if (this._uiElements.helpOverlay) {
      this._uiElements.helpOverlay.classList.add("hidden");
      this._uiElements.helpOverlay.classList.remove("flex");
      this._helpLogic.goTo(0);
      this.updateUIButtons(
        this._gameInstance.gameState.phase,
        this._gameInstance.gameState.resetLocked,
      );
    }
  }

  private setupPaddleTouchControls() {
    const shell = this._rootElm.querySelector<HTMLElement>(
      "#paddle-touch-controls",
    );
    if (!shell) return;

    const input = this._gameInstance.getInputManager();
    const mobileMq = window.matchMedia("(max-width: 767px)");
    const isPaddleTouchViewport = () => mobileMq.matches;

    const clearVirtualPaddles = () => {
      input.setVirtualP1Up(false);
      input.setVirtualP1Down(false);
      input.setVirtualP2Up(false);
      input.setVirtualP2Down(false);
    };

    const onViewportChange = () => {
      if (!mobileMq.matches) clearVirtualPaddles();
    };
    mobileMq.addEventListener("change", onViewportChange);

    const bindings: Record<string, (on: boolean) => void> = {
      "p1-up": (on) => input.setVirtualP1Up(on),
      "p1-down": (on) => input.setVirtualP1Down(on),
      "p2-up": (on) => input.setVirtualP2Up(on),
      "p2-down": (on) => input.setVirtualP2Down(on),
    };

    const cleanups: (() => void)[] = [];
    cleanups.push(() => mobileMq.removeEventListener("change", onViewportChange));

    shell.querySelectorAll<HTMLButtonElement>("[data-paddle-touch]").forEach(
      (btn) => {
        const mode = btn.dataset.paddleTouch;
        if (!mode || !bindings[mode]) return;
        const set = bindings[mode];

        const onDown = (e: PointerEvent) => {
          if (!isPaddleTouchViewport()) return;
          e.preventDefault();
          btn.setPointerCapture(e.pointerId);
          set(true);
        };
        const onUp = (e: PointerEvent) => {
          if (btn.hasPointerCapture(e.pointerId)) {
            btn.releasePointerCapture(e.pointerId);
          }
          set(false);
        };
        const onLostCapture = () => set(false);

        btn.addEventListener("pointerdown", onDown);
        btn.addEventListener("pointerup", onUp);
        btn.addEventListener("pointercancel", onUp);
        btn.addEventListener("lostpointercapture", onLostCapture);
        cleanups.push(() => {
          btn.removeEventListener("pointerdown", onDown);
          btn.removeEventListener("pointerup", onUp);
          btn.removeEventListener("pointercancel", onUp);
          btn.removeEventListener("lostpointercapture", onLostCapture);
        });
      },
    );

    this._detachPaddleTouch = () => {
      cleanups.forEach((fn) => fn());
      clearVirtualPaddles();
    };
  }

  private initButtonUIElements() {
    this._uiElements.overlay = this._rootElm.querySelector("#pause-overlay");
    this._uiElements.helpOverlay = this._rootElm.querySelector("#help-overlay");
    this._uiElements.paddleTouch = this._rootElm.querySelector(
      "#paddle-touch-controls",
    );
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
        this._rootElm.querySelectorAll<HTMLButtonElement>("[data-central-btn]"),
      ),
    };
  }

  private updateUIButtons(phase: GamePhase, resetLocked: boolean) {
    const help = this._uiElements.helpOverlay;
    const isHelpVisible =
      help !== null && !help.classList.contains("hidden");

    const visibility = this.getUIVisibility(phase, isHelpVisible);
    this.applyUIVisibility(visibility);
    this.updateResetButtonState(resetLocked);
  }

  private getUIVisibility(
    phase: GamePhase,
    isHelpVisible: boolean,
  ): ButtonUIVisibility {
    if (isHelpVisible) {
      return {
        overlay: false,
        helpOverlay: true,
        menuButtons: false,
        hudNavButtons: false,
        hudGameButtons: false,
      };
    }

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

  private applyUIVisibility(visibility: ButtonUIVisibility) {
    const { overlay, helpOverlay, menuButtons, hudNavButtons, hudGameButtons } =
      visibility;
    const { hud, menu } = this._uiElements;

    if (this._uiElements.overlay) {
      this.setDisplay(this._uiElements.overlay, overlay, "block");
    }

    if (this._uiElements.helpOverlay) {
      this.setDisplay(this._uiElements.helpOverlay, helpOverlay, "flex");
    }

    menu.all.forEach((btn) => {
      this.setDisplay(btn, menuButtons, "inline-flex");
    });

    this.setHudButtonVisibility(hud.help, hudNavButtons);
    this.setHudButtonVisibility(hud.home, hudNavButtons);
    this.setHudButtonVisibility(hud.settings, hudNavButtons);
    this.setHudButtonVisibility(hud.pause, hudGameButtons);
    this.setHudButtonVisibility(
      hud.cameraReset,
      hudGameButtons || this._gameInstance.gameState.phase === "pause",
    );

    if (this._uiElements.paddleTouch) {
      this.setDisplay(
        this._uiElements.paddleTouch,
        hudGameButtons,
        "block",
      );
    }
  }

  private setDisplay(
    el: HTMLElement,
    visible: boolean,
    visibleClass: "block" | "flex" | "inline-flex",
  ) {
    if (visible) {
      el.classList.remove("hidden");
      el.classList.add(visibleClass);
    } else {
      el.classList.add("hidden");
      el.classList.remove("block", "flex", "inline-flex");
    }
  }

  private setHudButtonVisibility(
    button: HTMLButtonElement | null,
    visible: boolean,
  ) {
    if (button) this.setDisplay(button, visible, "inline-flex");
  }

  private updateResetButtonState(resetLocked: boolean) {
    const { reset } = this._uiElements.menu;
    if (reset) {
      reset.disabled = resetLocked;
    }
  }

  onUnmount() {
    this._detachPaddleTouch?.();
    this._detachPaddleTouch = null;
    this._appElm.classList.remove("overflow-hidden");
    document.body.classList.remove(
      "bg-black",
      "text-white",
      "h-screen",
      "overflow-hidden",
      "m-0",
      "font-['Bebas_Neue',sans-serif]",
    );
    this._gameInstance.stopGame();
    this._helpLogic.stop();
  }
}
