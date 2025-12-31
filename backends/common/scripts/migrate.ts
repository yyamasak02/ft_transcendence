#!/usr/bin/env node
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));

type MigrationRow = { name: string };

type TableRow = { name: string };

export async function runMigrations(): Promise<void> {
  const db: Database = await open({
    filename: String(process.env.SQLITE_PATH),
    driver: sqlite3.Database,
  });

  await db.exec(
    "CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
  );

  const dir = join(__dirname, "../init_db/migrations");
  const files = readdirSync(dir).sort();

  const appliedRows = await db.all<MigrationRow[]>(
    "SELECT name FROM migrations",
  );
  const applied = new Set(appliedRows.map((row) => row.name));

  if (applied.size === 0) {
    const existing = await db.get<TableRow>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'",
    );
    if (existing) {
      await db.exec("BEGIN");
      try {
        for (const file of files) {
          await db.run("INSERT INTO migrations (name) VALUES (?)", file);
        }
        await db.exec("COMMIT");
      } catch (error) {
        await db.exec("ROLLBACK");
        throw error;
      }
      await db.close();
      console.log("All migrations completed successfully.");
      return;
    }
  }

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(dir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await db.exec("BEGIN");
    try {
      await db.exec(sql);
      await db.run("INSERT INTO migrations (name) VALUES (?)", file);
      await db.exec("COMMIT");
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
  }

  await db.close();
  console.log("All migrations completed successfully.");
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
