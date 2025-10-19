import fp from "fastify-plugin";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    const dbPath = process.env.SQLITE_PATH;
    if (!dbPath) {
      throw new Error("SQLITE_PATH is not set");
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    fastify.decorate("db", db);

    fastify.addHook("onClose", async () => {
      await db.close();
    });
  },
  {
    name: "database",
  },
);
