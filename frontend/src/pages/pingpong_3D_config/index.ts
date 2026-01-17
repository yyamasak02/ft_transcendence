// pingpong_3D_config/index.ts ルーティングと設定画面
import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { navigate } from "@/router";

import { saveSettings } from "../../utils/pingpong3D/gameSettings";
import { PreviewScene } from "./preview/PreviewScene";
import { t, word } from "@/i18n";
import type { PlayerType } from "../../utils/pingpong3D/gameSettings";
import { domRoots } from "@/layout/root";
import { isLoggedIn, userName } from "@/utils/auth-util";
import { setRemoteUserId } from "@/utils/pingpong3D/remoteSetting";

// ゲーム設定画面
const ICONS = {
  local: "/button/local.svg",
  host: "/button/host.svg",
  guest: "/button/guest.svg",
};

interface ModeOption {
  id: string;
  icon: string;
  titleKey: "mode_local" | "mode_host" | "mode_guest";
  descKey: "mode_local_desc" | "mode_host_desc" | "mode_guest_desc";
}

const MODES: ModeOption[] = [
  {
    id: "local",
    icon: ICONS.local,
    titleKey: "mode_local",
    descKey: "mode_local_desc",
  },
  {
    id: "host",
    icon: ICONS.host,
    titleKey: "mode_host",
    descKey: "mode_host_desc",
  },
  {
    id: "guest",
    icon: ICONS.guest,
    titleKey: "mode_guest",
    descKey: "mode_guest_desc",
  },
];

class PingPongComponent implements Component {
  private _root: HTMLElement;
  private _pp3dConfigRoot!: HTMLElement;

  private _modeCards!: NodeListOf<HTMLElement>;
  private _sections!: {
    local: HTMLElement;
    remote: HTMLElement;
  };
  private _commonSettings!: HTMLElement;
  private _previewContainer!: HTMLElement;

  private _remoteUI!: {
    container: HTMLElement;
    modeSelect: HTMLSelectElement;
    roomInput: HTMLInputElement;
  };

  private _ruleInputs!: {
    winningScore: HTMLInputElement;
    ballSpeed: HTMLInputElement;
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

  private _renderModeCards(): string {
    return MODES.map(
      (mode, index) => `
      <div class="pp3d-mode-card ${index === 0 ? "active" : ""}" data-mode="${mode.id}">
          <div class="pp3d-mode-icon">
              <img src="${mode.icon}" alt="${word(mode.titleKey)}" />
          </div>
          <div class="pp3d-mode-info">
              <h3>${t(mode.titleKey)}</h3>
              <p>${t(mode.descKey)}</p>
          </div>
      </div>
    `,
    ).join("");
  }

  render(): string {
    return `
      <div class="w-[900px] max-w-full" id="pp3d-config-root">
          <div class="pp3d-config">
              <h2 class="pp3d-title">${t("pingpong3d_config")}</h2>

              <div class="pp3d-mode-selector">
                  ${this._renderModeCards()}
              </div>

              <div class="pp3d-settings-container">
                  
                  <div id="local-section" class="pp3d-section">
                      <div class="pp3d-config-row">
                          <label>${t("player2Type")}</label>
                          <select id="player2-type">
                              <option value="Player">${t("player2")}</option>
                              <option value="Easy">${t("easyLv")}</option>
                              <option value="Normal" selected>${t("normalLv")}</option>
                              <option value="Hard">${t("hardLv")}</option>
                              <option value="Remote" class="hidden">Remote</option>
                          </select>
                      </div>
                  </div>
                  <!-- Remote Config -->
                  <div id="remote-section" class="pp3d-section hidden">
                        <select id="remote-mode" class="hidden">
                          <option value="guest">${t("guest")}</option>
                          <option value="host">${t("host")}</option>
                        </select>

                        <div class="pp3d-config-row">
                          <label class="pp3d-label">${t("room_id")}</label>
                          <input id="remote-room-id" type="text" placeholder="${word("room_id_placeholder_guest")}" />
                        </div>
                  </div>

                  <div class="pp3d-common-settings">
                      <div class="pp3d-config-row">
                          <label>${t("score_to_win")}</label>
                          <input id="winning-score" type="number" min="1" max="20" value="3" />
                      </div>

                      <div class="pp3d-config-row">
                          <label>${t("ball_speed")}</label>
                          <input id="ball-speed" type="range" min="0.1" max="2" step="0.1" value="1" />
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
                  </div>

                  <div class="pp-preview-container">
                      <canvas id="previewCanvas3D"></canvas>
                  </div>

                  <div class="pp3d-config-row pp3d-config-row--button">
                      <button id="pingpong-start-btn">${t("start")}</button>
                  </div>
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

    this._modeCards =
      this._pp3dConfigRoot.querySelectorAll<HTMLElement>(".pp3d-mode-card");

    this._sections = {
      local: this._get("#local-section"),
      remote: this._get("#remote-section"),
    };
    this._commonSettings = this._get(".pp3d-common-settings");
    this._previewContainer = this._get(".pp-preview-container");

    this._remoteUI = {
      container: this._get("#remote-section"),
      modeSelect: this._get("#remote-mode"),
      roomInput: this._get("#remote-room-id"),
    };

    this._ruleInputs = {
      winningScore: this._get("#winning-score"),
      ballSpeed: this._get("#ball-speed"),
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

    // モードカードクリック時のイベント
    this._modeCards.forEach((card) => {
      card.addEventListener("click", () => {
        this._modeCards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        const mode = card.dataset.mode;
        this.handleModeChange(mode);
      });
    });

    this._playerInputs.p1.length.addEventListener("input", updatePreview);
    this._playerInputs.p1.color.addEventListener("change", updatePreview);
    this._playerInputs.p2.length.addEventListener("input", updatePreview);
    this._playerInputs.p2.color.addEventListener("change", updatePreview);
    this._ruleInputs.stage.addEventListener("change", updatePreview);

    updatePreview();
    this._startBtn.addEventListener("click", async () => {
      // Always save local game settings
      saveSettings({
        winningScore: Number(this._ruleInputs.winningScore.value),
        ballSpeed: Number(this._ruleInputs.ballSpeed.value),
        rallyRush: this._ruleInputs.rallyRush.checked,
        selectedCountdownSpeed: Number(this._ruleInputs.countdown.value),
        selectedStageIndex: Number(this._ruleInputs.stage.value),
        player1Color: this._playerInputs.p1.color.value,
        player1Length: Number(this._playerInputs.p1.length.value),
        player2Color: this._playerInputs.p2.color.value,
        player2Length: Number(this._playerInputs.p2.length.value),
        player2Type: this._playerInputs.p2.type.value as PlayerType,
      });

      const p2Type = this._playerInputs.p2.type.value;
      if (p2Type !== "Remote") {
        navigate("/pingpong_3D");
        return;
      }

      // Remote flow
      const role = this._remoteUI.modeSelect.value as "host" | "guest";
      const userId = isLoggedIn()
        ? (userName() as string)
        : crypto.randomUUID();
      setRemoteUserId(userId);
      try {
        if (role === "host") {
          const res = await fetch("/api/connect/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          if (!res.ok) throw new Error("failed_create_room");
          const data = await res.json();
          const roomId = data.roomId as string;
          this._remoteUI.roomInput.value = roomId;
          navigate(
            `/pingpong_3D_remote?roomId=${encodeURIComponent(roomId)}&role=host`,
          );
        } else {
          const roomId = this._remoteUI.roomInput.value.trim();
          if (!roomId) return;
          const res = await fetch(
            `/api/connect/rooms/${encodeURIComponent(roomId)}/join`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            },
          );
          if (!res.ok) throw new Error("failed_join_room");
          navigate(
            `/pingpong_3D_remote?roomId=${encodeURIComponent(roomId)}&role=guest`,
          );
        }
      } catch (e) {
        // simple fallback: stay on page; optionally show alert
        console.error(e);
      }
    });
  }

  handleModeChange(mode: string | undefined) {
    if (!mode) return;

    if (mode === "local") {
      this._sections.local.classList.remove("hidden");
      this._sections.remote.classList.add("hidden");
      this._commonSettings.classList.remove("hidden");
      this._previewContainer.classList.remove("hidden");

      if (this._playerInputs.p2.type.value === "Remote") {
        this._playerInputs.p2.type.value = "Normal";
      }
    } else {
      this._sections.local.classList.add("hidden");
      this._sections.remote.classList.remove("hidden");
      this._playerInputs.p2.type.value = "Remote";

      if (mode === "host") {
        this._remoteUI.modeSelect.value = "host";
        this._remoteUI.roomInput.readOnly = true;
        this._sections.remote.classList.add("hidden");
        this._remoteUI.roomInput.value = "";
        this._commonSettings.classList.remove("hidden");
        this._previewContainer.classList.remove("hidden");
      } else if (mode === "guest") {
        this._remoteUI.modeSelect.value = "guest";
        this._remoteUI.roomInput.readOnly = false;
        this._remoteUI.roomInput.placeholder = word(
          "room_id_placeholder_guest",
        );
        this._remoteUI.roomInput.focus();
        this._commonSettings.classList.add("hidden");
        this._previewContainer.classList.add("hidden");
      }
    }
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
