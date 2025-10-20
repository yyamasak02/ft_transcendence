import type { FastifyPluginAsync } from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
const plugin: FastifyPluginAsync = async (fastify) => {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

  f.get(
    "",
    {
      websocket: true,
      schema: {
        tags: ["Auth"],
        response: {
          200: Type.String(),
        },
      },
    },
    async (socket, _) => {
      socket.on("message", (message) => {
        console.log("Received message:", message.toString());
        const msg = JSON.parse(message.toString());
        switch (msg.key) {
          case "ArrowLeft":
            msg.dx = -4;
            break;
          case "ArrowRight":
            msg.dx = 4;
            break;
          case "ArrowUp":
            msg.dy = -4;
            break;
          case "ArrowDown":
            msg.dy = 4;
            break;
        }
        socket.send(JSON.stringify(msg));
      });
    },
  );
};

export default plugin;
