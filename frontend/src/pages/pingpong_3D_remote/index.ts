import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { domRoots } from "@/layout/root";
import { isLoggedIn, userName } from "@/utils/auth-util";
import {
  getRemoteUserId,
  setRemoteUserId,
} from "@/utils/pingpong3D/remoteSetting";

type RoomJoinContext = {
  roomId: string;
  userId: string;
  side: "p1" | "p2";
};

class PingPong3DRemoteWaiting implements Component {
  private _root: HTMLElement;
  private _roomId = "";
  private _statusEl!: HTMLElement;
  private _roomEl!: HTMLElement;
  private _readyBtn!: HTMLButtonElement;
  private _ws: WebSocket | null = null;
  private _wsReady: boolean = false;
  private _tmpUserId!: string;
  private _pollTimer: number | null = null;

  constructor(root: HTMLElement) {
    this._root = root;
  }

  render(): string {
    return `
      <div class="w-[800px] max-w-full p-6 space-y-4">
        <h2 class="text-xl font-semibold">Remote 対戦 待機中</h2>
        <div>Room ID: <span id="room-id" class="font-mono"></span></div>
        <div id="status" class="text-sm">ステータス: 準備中...</div>
        <button id="ready-btn" class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled>READY</button>
        <div id="start-banner" class="hidden text-green-600 font-bold">START!</div>
      </div>
    `;
  }

  init() {
    this._roomEl = this._root.querySelector<HTMLElement>("#room-id")!;
    this._statusEl = this._root.querySelector<HTMLElement>("#status")!;
    this._readyBtn = this._root.querySelector<HTMLButtonElement>("#ready-btn")!;
    this._tmpUserId = isLoggedIn()
      ? (userName() as string)
      : (getRemoteUserId() as string);
    setRemoteUserId(this._tmpUserId);
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
          this._statusEl.textContent =
            "ステータス: マッチ成立。READYを押してください。";
          this._readyBtn.disabled = false;
          if (this._pollTimer !== null) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
          }
          this.connectWS();
        } else {
          this._statusEl.textContent = "ステータス: 相手待ち...";
        }
      } catch (e) {
        // ignore transient errors
      }
    };
    poll();
    this._pollTimer = window.setInterval(poll, 1500);
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
      this._wsReady = true;
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
                ? `開始まで ${Math.ceil(rest / 1000)} 秒`
                : "ゲーム開始!";
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
      this._wsReady = false;
    };
  }

  onMount() {
    this.init();
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    if (!roomId) {
      this._statusEl.textContent = "RoomID がありません。";
      return;
    }
    this._roomId = roomId;
    this._roomEl.textContent = roomId;
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
        this._statusEl.textContent = "READY 済み。相手を待っています...";
      };

      const ws = this._ws;
      if (ws && ws.readyState === WebSocket.OPEN) {
        sendReady();
        return;
      }
      // If connecting, wait for open; if not present, (re)connect and then send
      this._readyBtn.disabled = true;
      this._statusEl.textContent = "接続中... READY を送信します";
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
