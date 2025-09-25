import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
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
  const server = await fastify({
    logger: {
      level: "info",
    },
  });
  await server.register(fastifySwagger, {
    swagger: {
      info: {
        title: "My API",
        description: "API docs",
        version: "0.1.0",
      },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
  await server.register(jwt, { secret: "supersecret" });

  server.get("/users", async (req, reply) => {
    return await db.all("SELECT * FROM users");
  });

  server.post("/login", () => {
    return server.jwt.sign({ name: "inoh" });
  });

  server.get("/me", async (req) => {
    return await req.jwtVerify();
  });

  // connect待機
  server.listen(
    {
      port: 8080,
      host: "0.0.0.0",
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
  // hot reload対応
  if (import.meta?.hot) {
    import.meta.hot.on("vite:beforeFullReload", () => {
      return server.close();
    });
  }
}

main();
