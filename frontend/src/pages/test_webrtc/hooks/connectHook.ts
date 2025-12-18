import { createWebSocket } from "../api/connectApi";
import { SignalStatus, ActionTypes, EventTypes } from "../consts/consts";

export function useConnect({
  onSocketOpen = () => {},
  onMessageReceived = () => {},
  onSocketClosed = () => {},
}: {
  onSocketOpen?: () => void;
  onMessageReceived?: (message: any) => void;
  onSocketClosed?: () => void;
} = {}) {
  let signal_status: SignalStatus = SignalStatus.NO_CONNECTION;
  let ws: WebSocket | null = null;
  let roomId: String | null = null;
  let isHost: Boolean = false;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  function cleanup() {
    if (ws) {
      ws = null;
      signal_status = SignalStatus.NO_CONNECTION;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }
  async function connect(data: {
    action: ActionTypes;
    joinRoomId: string | null;
  }) {
    if (SignalStatus.NO_CONNECTION == signal_status && !ws) {
      ws = await createWebSocket(data);
      signal_status = SignalStatus.WAIT;
      ws.addEventListener("open", () => {
        onSocketOpen();
        console.log(`WebSocket connected`);
        heartbeatInterval = setInterval(() => {
          const heartbeatMsg = { action_type: ActionTypes.HEART_BEAT };
          // TODO ws null guard
          ws.send(JSON.stringify(heartbeatMsg));
        }, 5000);
      });
      ws.addEventListener("message", (event) => {
        const msg = JSON.parse(event.data);
        onMessageReceived(msg);
        if (EventTypes.HEALTH_CHECK !== msg.event_type) {
          console.log("from server: ", msg);
        }
      });
      ws.addEventListener("close", () => {
        onSocketClosed();
        cleanup();
        console.log("WebSocket disconnected");
      });
    }
  }
  async function disconnect() {
    if (ws && WebSocket.OPEN == ws.readyState) {
      console.log("Client initiating disconnection...");
      ws.close();
    } else {
      console.log("WebSocket is not in OPEN state.");
      cleanup();
    }
  }
  return { connect, disconnect };
}
