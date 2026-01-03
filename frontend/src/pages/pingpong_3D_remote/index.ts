import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { domRoots } from "@/layout/root";

function ensureUserId(): string {
  const KEY = "pp3d-remote-userId";
  let id = localStorage.getItem(KEY);
  if (!id) {
    // simple uuid v4 fallback
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

class PingPong3DRemoteWaiting implements Component {
  private _root: HTMLElement;
  private _roomId = "";
  private _statusEl!: HTMLElement;
  private _roomEl!: HTMLElement;
  private _readyBtn!: HTMLButtonElement;
  private _ws: WebSocket | null = null;
  private _wsReady: boolean = false;
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

  private connectWS() {
    if (this._ws) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${location.host}/ws/connect/ready`;
    const ws = new WebSocket(wsUrl);
    this._ws = ws;
    const userId = ensureUserId();
    ws.onopen = () => {
      this._wsReady = true;
      ws.send(
        JSON.stringify({ type: "connect", roomId: this._roomId, userId }),
      );
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === "game:start" && msg?.payload?.startAt) {
          const startAt: number = msg.payload.startAt as number;
          const userId = ensureUserId();
          // show simple countdown on this screen, then navigate to game with params
          const banner = this._root.querySelector<HTMLElement>("#start-banner");
          banner?.classList.remove("hidden");
          const diff = Math.max(0, startAt - Date.now());
          this._statusEl.textContent = `開始まで ${Math.ceil(diff / 1000)} 秒`;
          const countdownTimer = window.setInterval(() => {
            const rest = Math.max(0, startAt - Date.now());
            this._statusEl.textContent =
              rest > 0
                ? `開始まで ${Math.ceil(rest / 1000)} 秒`
                : "ゲーム開始!";
          }, 200);
          // determine side using current room status (host/guest)
          fetch(`/api/connect/rooms/${encodeURIComponent(this._roomId)}/status`)
            .then((r) => r.json())
            .then((info) => {
              // NOTE: Server uses host=p1(left), guest=p2(right)
              // But client uses p1=right, p2=left, so we swap
              const side = info?.hostUserId === userId ? "p2" : "p1";
              const params = new URLSearchParams({
                mode: "remote",
                roomId: this._roomId,
                userId,
                side,
                startAt: String(startAt),
              });
              // navigate immediately; the game page will wait until startAt
              window.clearInterval(countdownTimer);
              location.href = `/pingpong_3D?${params.toString()}`;
            })
            .catch(() => {
              // fallback: assume host=player1
              const params = new URLSearchParams({
                mode: "remote",
                roomId: this._roomId,
                userId,
                side: "p1",
                startAt: String(startAt),
              });
              window.clearInterval(countdownTimer);
              location.href = `/pingpong_3D?${params.toString()}`;
            });
        }
        if (msg?.type === "game:countdown") {
          const userId = ensureUserId();
          // Navigate immediately to server-authoritative remote mode
          fetch(`/api/connect/rooms/${encodeURIComponent(this._roomId)}/status`)
            .then((r) => r.json())
            .then((info) => {
              // NOTE: Server uses host=p1(left), guest=p2(right)
              // But client uses p1=right, p2=left, so we swap
              const side = info?.hostUserId === userId ? "p2" : "p1";
              const params = new URLSearchParams({
                mode: "remote",
                auth: "server",
                roomId: this._roomId,
                userId,
                side,
              });
              location.href = `/pingpong_3D?${params.toString()}`;
            })
            .catch(() => {
              const params = new URLSearchParams({
                mode: "remote",
                auth: "server",
                roomId: this._roomId,
                userId,
                side: "p1",
              });
              location.href = `/pingpong_3D?${params.toString()}`;
            });
        }
      } catch {}
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
      const userId = ensureUserId();
      const sendReady = () => {
        this._ws?.send(
          JSON.stringify({ type: "game:ready", roomId: this._roomId, userId }),
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
