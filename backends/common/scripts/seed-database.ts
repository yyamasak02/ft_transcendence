import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";
import { Database } from "sqlite";

export async function runSeeders(db: Database) {
  const dir = "init_db/seeders";
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
}
