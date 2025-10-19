import type { Routes } from "@/types/routes";
import "./style.css";

class WebSocketComponent {
  private animationId: number | null = null;
  private x = 0;
  private y = 0;
  private dx = 0;
  private dy = 0;

  render() {
    return `<canvas id="myCanvas" width="480" height="320"></canvas>`;
  }

  init() {
    const ws = new WebSocket(`/api/game/ws`);
    ws.onopen = () => {
      console.log("WebSocket connection opened");
    };
    ws.addEventListener("close", () => {
      console.log("WebSocket connection closed");
    });
    ws.addEventListener("message", (event) => {
      // console.log("Received from server:", event.data);
      const msg = JSON.parse(event.data);
      this.x = msg.x;
      this.y = msg.y;
      this.dx = msg.dx;
      this.dy = msg.dy;
    });
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    this.x = canvas.width / 2;
    this.y = canvas.height - 30;
    this.dx = 0;
    this.dy = 0;
    const drawBall = () => {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#00ffcc";
      ctx.fill();
      ctx.closePath();
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBall();
      this.x += this.dx;
      this.y += this.dy;
      if (this.x < 10) this.x = 10;
      if (this.x > canvas.width - 10) this.x = canvas.width - 10;
      if (this.y < 10) this.y = 10;
      if (this.y > canvas.height - 10) this.y = canvas.height - 10;

      this.animationId = requestAnimationFrame(draw);
    };
    const keyHandler = (e: KeyboardEvent) => {
      const data = {
        x: this.x,
        y: this.y,
        dx: this.dx,
        dy: this.dy,
        key: e.key,
      };
      ws.send(JSON.stringify(data));
    };
    const keyUpHandler = () => {
      this.dx = 0;
      this.dy = 0;
    };
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("keyup", keyUpHandler);
    draw();
    this.stop = () => {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("keyup", keyUpHandler);
    };
  }

  stop() {
    //
  }
}

const wsComponent = new WebSocketComponent();

export const WebSocketRoute: Routes = {
  "/websocket": {
    linkLabel: "WebSocket",
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
