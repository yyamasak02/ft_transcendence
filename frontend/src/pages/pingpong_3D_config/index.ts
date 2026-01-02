// pingpong_3D_config/index.ts ルーティングと設定画面
import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { navigate } from "@/router";

import { saveSettings } from "../../utils/pingpong3D/gameSettings";
import { PreviewScene } from "./preview/PreviewScene";
import { t, word } from "@/i18n";
import type { PlayerType } from "../../utils/pingpong3D/gameSettings";
import { domRoots } from "@/layout/root";

// ゲーム設定画面
class PingPongComponent implements Component {
  private _root: HTMLElement;
  private _pp3dConfigRoot!: HTMLElement;

  private _remoteUI!: {
    container: HTMLElement;
    modeSelect: HTMLSelectElement;
    roomInput: HTMLInputElement;
  };

  private _ruleInputs!: {
    winningScore: HTMLInputElement;
    rallyRush: HTMLInputElement;
    countdown: HTMLSelectElement;
    stage: HTMLSelectElement;
  };

  private _playerInputs!: {
    p1: {
      length: HTMLInputElement;
      color: HTMLSelectElement;
    };
    p2: {
      length: HTMLInputElement;
      color: HTMLSelectElement;
      type: HTMLSelectElement;
    };
  };

  private _previewUI!: {
    canvas: HTMLCanvasElement;
    scene: PreviewScene | null;
  };

  private _startBtn!: HTMLButtonElement;

  constructor(root: HTMLElement) {
    this._root = root;
  }

  render(): string {
    return `
            <div class="w-[800px] max-w-full" id="pp3d-config-root" class="pp3d-config">
                <div class="pp3d-config">
                    <h2>${t("pingpong3d_config")}</h2>
                    <div class="pp3d-config-row">
                        <label>${t("player2Type") || "Opponent"}</label>
                        <select id="player2-type">
                            <option value="Player">${t("player2")}</option>
                            <option value="Easy">${t("easyLv")}</option>
                            <option value="Normal" selected>${t("normalLv")}</option>
                            <option value="Hard">${t("hardLv")}</option>
                            <option value="Remote">Remote</option>
                        </select>
                    </div>
                    <!-- Remote Config -->
                    <div id="remote-config" class="hidden">
                      <div class="pp3d-config-row">
                        <label class="pp3d-label">接続モード</label>
                        <select id="remote-mode">
                          <option value="guest">ゲスト</option>
                          <option value="host">ホスト</option>
                        </select>
                      </div>
                      <div class="pp3d-config-row">
                        <label class="pp3d-label">ルームID</label>
                        <input id="remote-room-id" type="text" placeholder="例: ABCD-1234" />
                      </div>
                    </div>


                    <div class="pp3d-config-row">
                        <label>${t("score_to_win")}</label>
                        <input id="winning-score" type="number" min="1" max="20" value="3" />
                    </div>

                    <div class="pp3d-config-row">
                        <label>${t("count_speed")}</label>
                        <select id="countdown-interval">
                            <option value="500">${t("fast")}</option>
                            <option value="1000" selected>${t("normal")}</option>
                            <option value="2000">${t("slow")}</option>
                        </select>
                    </div>
                    
                    <div class="pp3d-config-row">
                        <label>${t("stage")}</label>
                        <select id="stage-select">
                            <option value="0">${t("classic")}</option>
                            <option value="1">${t("shadow")}</option>
                            <option value="2">${t("warp")}</option>
                        </select>
                    </div>

                    <div class="pp3d-config-row pp3d-inline-row">
                            <label class="pp3d-label">${t("color1")}</label>
                            <select id="paddle1-color" class="pp3d-color-select">
                                <option value="blue">${t("blue")}</option>
                                <option value="green">${t("green")}</option>
                                <option value="red">${t("red")}</option>
                                <option value="yellow">${t("yellow")}</option>
                                <option value="white">${t("white")}</option>
                                <option value="black">${t("black")}</option>
                                <option value="pink">${t("pink")}</option>
                            </select>

                            <div class="pp3d-length-group">
                                <label class="pp3d-sub-label">${t("length")}</label>
                                <input id="paddle1-length" type="range" min="1" max="10" step="1" value="8" />
                            </div>
                        </div>

                        <div class="pp3d-config-row pp3d-inline-row">
                            <label class="pp3d-label">${t("color2")}</label>
                            <select id="paddle2-color" class="pp3d-color-select">
                                <option value="green">${t("green")}</option>
                                <option value="blue">${t("blue")}</option>
                                <option value="red">${t("red")}</option>
                                <option value="yellow">${t("yellow")}</option>
                                <option value="white">${t("white")}</option>
                                <option value="black">${t("black")}</option>
                                <option value="pink">${t("pink")}</option>
                            </select>

                            <div class="pp3d-length-group">
                                <label class="pp3d-sub-label">${t("length")}</label>
                                <input id="paddle2-length" type="range" min="1" max="10" step="1" value="8" />
                            </div>
                        </div>

                    <div class="pp3d-config-row">
                        <label>${t("collapse_mode")}</label>
                        <div class="pp3d-toggle-container">
                            <input id="rally-rush-toggle" type="checkbox" checked class="pp3d-toggle-input" />
                            <span class="pp3d-toggle-text">${t("collapse_explanation")}</span>
                        </div>
                    </div>

                    <div class="pp-preview-container">
                        <canvas id="previewCanvas3D"></canvas>
                    </div>

                    <div class="pp3d-config-row pp3d-config-row--button">
                        <button id="pingpong-start-btn">${t("start")}</button>
                    </div>

                </div>
            </div>
        `;
  }

  private _get<T extends HTMLElement>(selector: string): T {
    const el = this._pp3dConfigRoot.querySelector<T>(selector);
    if (!el) throw new Error(`Missing DOM: ${selector}`);
    return el;
  }

  init() {
    const root = this._root.querySelector<HTMLElement>("#pp3d-config-root");
    if (!root) throw new Error("Failed to get DOM pp3dConfigRoot");
    this._pp3dConfigRoot = root;

    this._remoteUI = {
      container: this._get("#remote-config"),
      modeSelect: this._get("#remote-mode"),
      roomInput: this._get("#remote-room-id"),
    };

    this._ruleInputs = {
      winningScore: this._get("#winning-score"),
      rallyRush: this._get("#rally-rush-toggle"),
      countdown: this._get("#countdown-interval"),
      stage: this._get("#stage-select"),
    };

    this._playerInputs = {
      p1: {
        length: this._get("#paddle1-length"),
        color: this._get("#paddle1-color"),
      },
      p2: {
        length: this._get("#paddle2-length"),
        color: this._get("#paddle2-color"),
        type: this._get("#player2-type"),
      },
    };

    this._previewUI = {
      canvas: this._get("#previewCanvas3D"),
      scene: null,
    };

    this._startBtn = this._get("#pingpong-start-btn");
  }

  onMount() {
    document.body.classList.add("pingpong-page", "overflow-hidden");
    document.documentElement.classList.add("overflow-hidden");

    this.init();

    this._previewUI.scene = new PreviewScene(this._previewUI.canvas);

    const updatePreview = () => {
      const { p1, p2 } = this._playerInputs;
      const stage = Number(this._ruleInputs.stage.value);

      this._previewUI.scene?.updatePreview(
        Number(p1.length.value),
        p1.color.value,
        Number(p2.length.value),
        p2.color.value,
        stage,
      );
    };

    this._playerInputs.p2.type.addEventListener("change", () => {
      const isRemote = this._playerInputs.p2.type.value === "Remote";
      this._remoteUI.container.classList.toggle("hidden", !isRemote);
      if (isRemote) {
        // Default to guest for editable ID input
        this._remoteUI.modeSelect.value = "guest";
        this._remoteUI.roomInput.readOnly = false;
        this._remoteUI.roomInput.placeholder = "例: ABCD-1234";
      }
    });

    this._remoteUI.modeSelect.addEventListener("change", () => {
      const isHost = this._remoteUI.modeSelect.value === "host";
      this._remoteUI.roomInput.readOnly = isHost;
      if (isHost) {
        this._remoteUI.roomInput.placeholder = "ホストIDは自動生成されます";
      } else {
        this._remoteUI.roomInput.placeholder = "例: ABCD-1234";
      }
    });

    this._playerInputs.p1.length.addEventListener("input", updatePreview);
    this._playerInputs.p1.color.addEventListener("change", updatePreview);
    this._playerInputs.p2.length.addEventListener("input", updatePreview);
    this._playerInputs.p2.color.addEventListener("change", updatePreview);
    this._ruleInputs.stage.addEventListener("change", updatePreview);

    updatePreview();

    this._startBtn.addEventListener("click", () => {
      saveSettings({
        winningScore: Number(this._ruleInputs.winningScore.value),
        rallyRush: this._ruleInputs.rallyRush.checked,
        selectedCountdownSpeed: Number(this._ruleInputs.countdown.value),
        selectedStageIndex: Number(this._ruleInputs.stage.value),
        player1Color: this._playerInputs.p1.color.value,
        player1Length: Number(this._playerInputs.p1.length.value),
        player2Color: this._playerInputs.p2.color.value,
        player2Length: Number(this._playerInputs.p2.length.value),
        player2Type: this._playerInputs.p2.type.value as PlayerType,
      });

      navigate("/pingpong_3D");
    });
  }

  onUnmount() {
    this._previewUI.scene?.dispose();
    this._previewUI.scene = null;
    document.body.classList.remove("pingpong-page", "overflow-hidden");
    document.documentElement.classList.remove("overflow-hidden");
  }
}


const pingPong3DSettingComponent = new PingPongComponent(domRoots.app);

export const PingPong3DSettingRoute: Route = {
  linkLabel: () => word("pingpong3d_config"),
  content: () => pingPong3DSettingComponent.render(),
  onMount: () => pingPong3DSettingComponent.onMount(),
  onUnmount: () => pingPong3DSettingComponent.onUnmount(),
  head: {
    title: "Setting PingPong 3D",
  },
};
