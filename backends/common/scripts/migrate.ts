#!/usr/bin/env node
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const db: Database = await open({
    filename: String(process.env.SQLITE_PATH),
    driver: sqlite3.Database,
  });

  const dir = join(__dirname, "../init_db/migrations");
  const files = readdirSync(dir).sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await db.exec(sql);
  }

  await db.close();
  console.log("All migrations completed successfully.");
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
