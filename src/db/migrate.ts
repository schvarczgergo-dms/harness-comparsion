import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "migrations");

async function migrate(): Promise<void> {
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    await pool.query(sql);
    console.log(`applied migration: ${file}`);
  }
}

try {
  await migrate();
  console.log("migrations complete");
} catch (error) {
  console.error("migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
