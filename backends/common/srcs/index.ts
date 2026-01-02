import Fastify from "fastify";
import fp from "fastify-plugin";
import serviceApp from "./app.js";
import "./types/augmentations.js";

async function main() {
  // fastify instance init
  const server = await Fastify({
    logger: {
      level: "info",
    },
    pluginTimeout: Number(process.env.PLUGIN_TIMEOUT ?? 60000),
  });

  // モジュールを登録する
  await server.register(fp(serviceApp));

  // connect待機
  server.listen(
    {
      port: Number(process.env.PORT) ?? 8080,
      host: process.env.HOST,
    },
    (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server listening at ${address}`);
    },
  );

  await server.ready();
  console.log("print routes", server.printRoutes());
  // hot reload対応
  if (import.meta?.hot) {
    import.meta.hot.on("vite:beforeFullReload", () => {
      return server.close();
    });
  }
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
