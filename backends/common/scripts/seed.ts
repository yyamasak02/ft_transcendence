#!/usr/bin/env node
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runSeeders(): Promise<void> {
  const db: Database = await open({
    filename: String(process.env.SQLITE_PATH),
    driver: sqlite3.Database,
  });

  const dir = join(__dirname, "../init_db/seeders");
  const files = readdirSync(dir)
    .sort()
    .map((file: string) => ({
      file,
      match: file.match(/^\d{3}_(.+)\.csv$/),
    }))
    .filter(
      (target: { file: string; match: RegExpMatchArray | null }) =>
        target.match !== null,
    );

  for (const { file, match } of files) {
    const table = match![1];
    console.log(`Running seeder: ${file} -> Table: ${table}`);
    const csvData = readFileSync(join(dir, file), "utf-8");
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    }) as Record<string, any>[];
    await Promise.all(
      records.map(async (row) => {
        const keys = Object.keys(row);
        const cols = keys.join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const values = Object.values(row);
        return db.run(
          `INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${placeholders})`,
          ...values,
        );
      }),
    );
  }
  await db.close();
  console.log("All seeders completed successfully.");
}

runSeeders().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
