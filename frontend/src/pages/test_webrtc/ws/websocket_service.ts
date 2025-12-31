import { createWebSocket } from "./connect_ws";
import { SignalStatus, ActionTypes, EventTypes } from "../consts/consts";
import { v4 as uuidv4 } from "uuid";

type Callbacks = {
  onSocketOpen?: () => void;
  onMessageReceived?: (message: any) => void;
  onSocketClosed?: () => void;
};

export class WebSocketService {
  private userId: string = uuidv4();
  private ws: WebSocket | null = null;
  private signalStatus: SignalStatus = SignalStatus.NO_CONNECTION;
  private heartbeatInterval: number | null = null;
  private joinedRoomId: string | null = null;

  private callbacks: Required<Callbacks> = {
    onSocketOpen: () => {},
    onMessageReceived: () => {},
    onSocketClosed: () => {},
  };

  configure(callbacks: Callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  async connect(data: { action: ActionTypes; joinRoomId: string | null }) {
    if (this.signalStatus !== SignalStatus.NO_CONNECTION || this.ws) {
      return;
    }
    data.userId = this.userId;

    this.ws = await createWebSocket(data);
    this.signalStatus = SignalStatus.WAIT;

    this.ws.addEventListener("open", () => {
      this.callbacks.onSocketOpen();
      console.log("WebSocket connected");

      this.heartbeatInterval = window.setInterval(() => {
        this.send({ action_type: ActionTypes.HEART_BEAT });
      }, 5000);
    });

    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      this.callbacks.onMessageReceived(msg);

      if (msg.event_type === EventTypes.JOINED_ROOM) {
        this.joinedRoomId = msg.payload.responseRoomInfo.roomId;
      }

      if (msg.event_type !== EventTypes.HEALTH_CHECK) {
        console.log("from server:", msg);
      }
    });

    this.ws.addEventListener("close", () => {
      this.callbacks.onSocketClosed();
      this.cleanup();
      console.log("WebSocket disconnected");
    });
  }

  send(message: { action: ActionTypes; key: string | null }) {
    const msg = {
      action_type: message.action,
      key: message.key,
      roomId: this.joinedRoomId,
      userId: this.userId,
    };
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }

  disconnect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("Client initiating disconnection...");
      this.ws.close();
    } else {
      this.cleanup();
    }
  }

  private cleanup() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.ws = null;
    this.signalStatus = SignalStatus.NO_CONNECTION;
    this.joinedRoomId = null;
  }
}
