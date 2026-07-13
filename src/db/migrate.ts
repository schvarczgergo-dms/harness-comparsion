import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./pool.ts";

const here = dirname(fileURLToPath(import.meta.url));

async function migrate(): Promise<void> {
  const sql = await readFile(join(here, "migrations", "001_init.sql"), "utf8");
  await pool.query(sql);
  console.log("[migrate] applied 001_init.sql");
}

migrate()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("[migrate] failed:", err);
    await pool.end();
    process.exit(1);
  });
