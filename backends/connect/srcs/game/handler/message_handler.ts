import { WebSocket } from "@fastify/websocket";
import { Value } from "@sinclair/typebox/value";
import type { GameService } from "../service/message_service.js";
import { clientMessageSchema, MSG } from "../../schemas/ws.js";

export function makeMessageHandler(service: GameService) {
  return (socket: WebSocket) => {
    socket.on("message", (raw) => {
      try {
        const parsed: unknown = JSON.parse(raw.toString());
        if (!Value.Check(clientMessageSchema, parsed)) return;

        switch (parsed.type) {
          case MSG.CONNECT:
            service.registerSocket(parsed, socket);
            break;
          case MSG.GAME_READY:
            service.markReadyAndMaybeStart(parsed);
            break;
          case MSG.INPUT_PADDLE:
            service.handleInputPaddle(parsed);
            break;
        }
      } catch {
        // ignore invalid json
      }
    });

    socket.on("close", () => {
      service.handleDisconnect(socket);
    });
  };
}
