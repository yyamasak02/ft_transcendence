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
    filename: process.env.DB_PATH || "./db.sqlite",
    driver: sqlite3.Database,
  });

  const dir = join(__dirname, "../init_db/seeders");
  const files = readdirSync(dir).sort();

  for (const file of files) {
    console.log(`Running seeder: ${file}`);
    const csvData = readFileSync(join(dir, file), "utf-8");

    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    }) as Record<string, string>[];

    const table = file.split("_")[1].replace(".csv", "");

    for (const row of records) {
      const cols = Object.keys(row).join(", ");
      const placeholders = Object.keys(row)
        .map(() => "?")
        .join(", ");
      await db.run(
        `INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${placeholders})`,
        ...Object.values(row),
      );
    }
  }

  await db.close();
  console.log("All seeders completed successfully.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeders().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}
