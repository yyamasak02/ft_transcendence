import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Database } from "sqlite";

export async function runMigrations(db: Database) {
  const dir = "init_db/migrations";
  const files = readdirSync(dir).sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await db.exec(sql);
  }
}
