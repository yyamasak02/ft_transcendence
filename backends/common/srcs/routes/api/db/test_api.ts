// srcs/routes/api/db/test_api.ts
// 保存コード：curl -X POST http://localhost:8080/api/db/test_api   -H "Content-Type: application/json"   -d '{"userId": 1, "message": "こんにちは SQLite!"}'
// 取得コード：curl -X POST http://localhost:8080/api/db/test_api/1
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

const plugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const db = await open({
    filename: process.env.DB_FILE ?? "./app.db",
    driver: sqlite3.Database,
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  fastify.addHook("onClose", async () => { await db.close(); });

  // 既存GET
  fastify.get("/test_api", async () => ({ message: "hello user!" }));

  // 追加: 保存
  fastify.post("/test_api", {
    schema: {
      body: {
        type: "object",
        required: ["userId", "message"],
        properties: {
          userId: { type: "integer", minimum: 1 },
          message: { type: "string", minLength: 1, maxLength: 1000 },
        },
      },
    },
  }, async (req, reply) => {
    const { userId, message } = req.body as { userId: number; message: string };
    const result = await db.run(
      "INSERT INTO messages (user_id, message) VALUES (?, ?)",
      userId, message
    );
    reply.code(201);
    return { id: result.lastID, status: "created" };
  });

  // 取得
fastify.get("/test_api/:userId", async (req) => {
  const { userId } = req.params as { userId: string };
  return await db.all(
    "SELECT * FROM messages WHERE user_id = ?",
    userId
  );
});
};

export default plugin;
