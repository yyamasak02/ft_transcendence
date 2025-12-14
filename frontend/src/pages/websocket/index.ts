import type { Routes } from "@/types/routes";
import "./style.css";
import { word } from "@/i18n";

class WebSocketComponent {
  private animationId: number | null = null;
  private ws: WebSocket | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private x = 0;
  private y = 0;
  private dx = 0;
  private dy = 0;

  render() {
    return `<canvas id="myCanvas" width="480" height="320"></canvas>`;
  }

  // 🔹 通信だけ更新可能にするため、別メソッドに分離
  setupSocket() {
    if (this.ws) this.ws.close();
    this.ws = new WebSocket(`/api/game/ws`);

    this.ws.addEventListener("open", () => {
      console.log("WebSocket connected");
    });

    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      Object.assign(this, msg); // x, y, dx, dyをまとめて更新
    });

    this.ws.addEventListener("close", () => {
      console.log("WebSocket disconnected");
    });
  }

  init() {
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    if (!canvas) return;
    this.ctx = canvas.getContext("2d");
    this.x = canvas.width / 2;
    this.y = canvas.height - 30;
    this.dx = 0;
    this.dy = 0;

    // 🔹 ここを「部分更新可能」にした
    this.setupSocket();

    const drawBall = () => {
      const ctx = this.ctx!;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#00ffcc";
      ctx.fill();
      ctx.closePath();
    };

    const draw = () => {
      const ctx = this.ctx!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBall();
      this.x += this.dx;
      this.y += this.dy;
      this.x = Math.min(Math.max(this.x, 10), canvas.width - 10);
      this.y = Math.min(Math.max(this.y, 10), canvas.height - 10);
      this.animationId = requestAnimationFrame(draw);
    };

    // キーを長押しすると遅くなるため、長押し期間中は通信しない
    let lastKey: string | null = null;
    const send = (key: string) => {
      if (key === lastKey) return;
      lastKey = key;
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      this.ws.send(
        JSON.stringify({
          x: this.x,
          y: this.y,
          dx: this.dx,
          dy: this.dy,
          key,
        }),
      );
    };

    const keyHandler = (e: KeyboardEvent) => send(e.key);
    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key == lastKey) {
        lastKey = null;
      }
      this.dx = 0;
      this.dy = 0;
    };

    window.addEventListener("keydown", keyHandler);
    window.addEventListener("keyup", keyUpHandler);
    draw();

    this.stop = () => {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.ws?.close();
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("keyup", keyUpHandler);
    };
  }

  stop() {}
}

const wsComponent = new WebSocketComponent();

export const WebSocketRoute: Routes = {
  "/websocket": {
    linkLabel: word("websocket"),
    content: wsComponent.render(),
    onMount: () => {
      console.log("WebSocket page mounted");
      document.body.classList.add("websocket-page", "overflow-hidden");
      document.documentElement.classList.add("overflow-hidden");

      wsComponent.init();
    },
    onUnmount: () => {
      console.log("WebSocket page unmounted");
      document.body.classList.remove("websocket-page", "overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");

      wsComponent.stop();
    },
    head: {
      title: "WebSocket Manual Control",
    },
  },
};
