import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { domRoots } from "@/layout/root";
import { isLoggedIn, userName } from "@/utils/auth-util";
import {
  getRemoteUserId,
  setRemoteUserId,
} from "@/utils/pingpong3D/remoteSetting";
import { t, word } from "@/i18n";
import "./style.css";

const POLLING_INTERVAL_MS = 1500;
const FEEDBACK_DISPLAY_MS = 1500;

type RoomJoinContext = {
  roomId: string;
  userId: string;
  side: "p1" | "p2";
};

class PingPong3DRemoteWaiting implements Component {
  private _root: HTMLElement;
  private _roomId = "";
  private _statusEl!: HTMLElement;
  private _roomValueEl!: HTMLElement;
  private _roomDisplayEl!: HTMLElement;
  private _copyFeedbackEl!: HTMLElement;
  private _readyBtn!: HTMLButtonElement;
  private _loaderEl!: HTMLElement;
  private _ws: WebSocket | null = null;
  private _tmpUserId!: string;
  private _pollTimer: number | null = null;

  constructor(root: HTMLElement) {
    this._root = root;
  }

  render(): string {
    return `
      <div class="pp3d-wait-wrapper">
        <div class="pp3d-wait-card">
          <h2 class="pp3d-title-holo">${t("remote_wait_for")}</h2>
          
          <div id="room-display" class="pp3d-room-display" title="${word("click_to_copy")}">
             <span class="pp3d-room-label">${t("room_id")}</span>
             <span id="room-id-value" class="pp3d-room-value">Loading...</span>
             
             <div class="pp3d-copy-hint">
               <img src="../../../public/button/copy.svg" class="pp3d-copy-icon" style="width: 1.2em; height: 1.2em; vertical-align: middle;" />
               <span>${t("click_to_copy")}</span>
             </div>
             
             <div id="copy-feedback" class="pp3d-copy-feedback">${t("copied")}</div>
          </div>

          <div class="pp3d-status-area">
             <div id="loading-42" class="pp3d-loading-42">
                <span class="walking-number num-4">4</span>
                <span class="walking-number num-2">2</span>
             </div>
             <div id="status-text" class="pp3d-status-text">${t("remote_status")}...</div>
          </div>

          <button id="ready-btn" class="pp3d-ready-btn" disabled>
            ${t("remote_ready")}
          </button>
        </div>
      </div>
    `;
  }

  init() {
    this._roomDisplayEl =
      this._root.querySelector<HTMLElement>("#room-display")!;
    this._roomValueEl =
      this._root.querySelector<HTMLElement>("#room-id-value")!;
    this._copyFeedbackEl =
      this._root.querySelector<HTMLElement>("#copy-feedback")!;
    this._statusEl = this._root.querySelector<HTMLElement>("#status-text")!;
    this._loaderEl = this._root.querySelector<HTMLElement>("#loading-42")!;
    this._readyBtn = this._root.querySelector<HTMLButtonElement>("#ready-btn")!;
    this._tmpUserId = isLoggedIn()
      ? (userName() as string)
      : (getRemoteUserId() as string);
    setRemoteUserId(this._tmpUserId);
    this._roomDisplayEl.addEventListener("click", () => this.handleCopy());
  }
  private handleCopy() {
    if (!this._roomId) return;
    navigator.clipboard
      .writeText(this._roomId)
      .then(() => {
        this._copyFeedbackEl.textContent = word("copied");
        this._copyFeedbackEl.classList.add("show");
        setTimeout(() => {
          this._copyFeedbackEl.classList.remove("show");
        }, FEEDBACK_DISPLAY_MS);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        this._copyFeedbackEl.textContent = word("failed");
        this._copyFeedbackEl.classList.add("show");
        setTimeout(() => {
          this._copyFeedbackEl.classList.remove("show");
        }, FEEDBACK_DISPLAY_MS);
      });
  }

  private startPolling() {
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/connect/rooms/${encodeURIComponent(this._roomId)}/status`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "matched") {
          this._statusEl.textContent = `${word("remote_ready_message")}`;
          this._readyBtn.disabled = false;
          this._loaderEl.style.display = "none";
          if (this._pollTimer !== null) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
          }
          this.connectWS();
        } else {
          this._statusEl.textContent = `${word("remote_wait_for")}`;
          this._loaderEl.style.display = "flex";
        }
      } catch (e) {
        // ignore transient errors
      }
    };
    poll();
    this._pollTimer = window.setInterval(poll, POLLING_INTERVAL_MS);
  }

  private async fetchRoomSide(
    roomId: string,
    userId: string,
  ): Promise<RoomJoinContext> {
    return fetch(`/api/connect/rooms/${encodeURIComponent(roomId)}/status`)
      .then((r) => r.json())
      .then((info) => {
        const side: "p1" | "p2" = info?.hostUserId === userId ? "p1" : "p2";
        return { roomId, userId, side };
      })
      .catch(() => ({
        roomId,
        userId,
        side: "p1",
      }));
  }
  private buildGameParams(
    ctx: RoomJoinContext,
    opts: {
      mode: "remote" | "local";
      auth?: "server";
      startAt?: number;
    },
  ) {
    return new URLSearchParams({
      mode: opts.mode,
      auth: opts.auth ?? "",
      roomId: ctx.roomId,
      userId: ctx.userId,
      side: ctx.side,
      ...(opts.startAt ? { startAt: String(opts.startAt) } : {}),
    });
  }
  private connectWS() {
    if (this._ws) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${location.host}/ws/connect/ready`;
    const ws = new WebSocket(wsUrl);
    this._ws = ws;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "connect",
          roomId: this._roomId,
          userId: this._tmpUserId,
        }),
      );
    };
    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === "game:start" && msg?.payload?.startAt) {
          const startAt: number = msg.payload.startAt as number;
          // show simple countdown on this screen, then navigate to game with params
          const banner = this._root.querySelector<HTMLElement>("#start-banner");
          banner?.classList.remove("hidden");
          const diff = Math.max(0, startAt - Date.now());
          this._statusEl.textContent = `開始まで ${Math.ceil(diff / 1000)} 秒`;
          const COUNTDOWN_UPDATE_INTERVAL_MS = 200;
          const countdownTimer = window.setInterval(() => {
            const rest = Math.max(0, startAt - Date.now());
            this._statusEl.textContent =
              rest > 0
                ? `${word("remote_game_starting_in")} ${Math.ceil(rest / 1000)} ${word("seconds_unit")}`
                : word("remote_game_started");
          }, COUNTDOWN_UPDATE_INTERVAL_MS);
          // determine side using current room status (host/guest)
          const ctx = await this.fetchRoomSide(this._roomId, this._tmpUserId);
          const params = this.buildGameParams(ctx, {
            mode: "remote",
            startAt: startAt,
          });
          window.clearInterval(countdownTimer);
          location.href = `/pingpong_3D?${params.toString()}`;
        }
        if (msg?.type === "game:countdown") {
          // Navigate immediately to server-authoritative remote mode
          const ctx = await this.fetchRoomSide(this._roomId, this._tmpUserId);
          const params = this.buildGameParams(ctx, {
            mode: "remote",
            auth: "server",
          });
          // TODO URLパラメータをnavigate()で扱えるべきだがそうしてないのでいったんこれで
          location.href = `/pingpong_3D?${params.toString()}`;
        }
      } catch (error) {
        console.warn(error);
      }
    };
    ws.onclose = () => {
      this._ws = null;
    };
  }

  onMount() {
    this.init();
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    if (!roomId) {
      this._statusEl.textContent = word("remote_no_room_id_message");
      this._loaderEl.style.display = "none";
      return;
    }
    this._roomId = roomId;
    this._roomValueEl.textContent = roomId;
    this._readyBtn.addEventListener("click", () => {
      const sendReady = () => {
        this._ws?.send(
          JSON.stringify({
            type: "game:ready",
            roomId: this._roomId,
            userId: this._tmpUserId,
          }),
        );
        this._readyBtn.disabled = true;
        this._statusEl.textContent = word("remote_ready_done_waiting_message");
        this._loaderEl.style.display = "flex";
      };

      const ws = this._ws;
      if (ws && ws.readyState === WebSocket.OPEN) {
        sendReady();
        return;
      }
      // If connecting, wait for open; if not present, (re)connect and then send
      this._readyBtn.disabled = true;
      this._statusEl.textContent = word(
        "remote_connecting_and_send_ready_message",
      );
      if (
        !ws ||
        ws.readyState === WebSocket.CLOSING ||
        ws.readyState === WebSocket.CLOSED
      ) {
        this.connectWS();
      }
      this._ws?.addEventListener("open", () => sendReady(), { once: true });
    });
    this.startPolling();
  }

  onUnmount() {
    if (this._pollTimer !== null) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
  }
}

const waiting = new PingPong3DRemoteWaiting(domRoots.app);

export const PingPong3DRemoteWaitingRoute: Route = {
  linkLabel: () => "PingPong 3D Remote Waiting",
  content: () => waiting.render(),
  onMount: () => waiting.onMount(),
  onUnmount: () => waiting.onUnmount(),
  head: { title: "PingPong 3D Remote Waiting" },
};
