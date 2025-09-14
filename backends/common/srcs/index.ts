import fastify from "fastify";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { runMigrations } from "./utils/migrate";
import { runSeeders } from "./utils/seed";

async function main() {
  // db init
  const db = await open({
    filename: "db/common.sqlite",
    driver: sqlite3.Database,
  });
  await runMigrations(db);
  await runSeeders(db);

  // fastify instance init
  const server = fastify({
    logger: {
      level: "info",
    },
  });

  server.get("/users", async (request, reply) => {
    return await db.all("SELECT * FROM users");
  });

  // connect待機
  server.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });

  // hot reload対応
  if (import.meta.hot) {
    import.meta.hot.on("vite:beforeFullReload", () => {
      return server.close();
    });
  }
}

main();
