import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./db/pool.ts";
import { lookupCoord } from "./geo/reference.ts";

interface SeedCustomer {
  name: string;
  budget?: number;
  location: { city: string; countryCode?: string };
  note?: string;
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const UPSERT = `
  INSERT INTO customers (name, telepules, country_code, budget, note, lat, lon)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (name, telepules) DO UPDATE SET
    country_code = EXCLUDED.country_code,
    budget       = EXCLUDED.budget,
    note         = EXCLUDED.note,
    lat          = EXCLUDED.lat,
    lon          = EXCLUDED.lon
`;

async function seed(): Promise<void> {
  const raw = await readFile(join(repoRoot, "seed-customers.json"), "utf8");
  const customers: SeedCustomer[] = JSON.parse(raw);

  let geocoded = 0;
  let unknown = 0;

  for (const c of customers) {
    const city = c.location.city;
    const coord = lookupCoord(city);
    if (coord) {
      geocoded += 1;
    } else {
      unknown += 1;
      console.warn(`[seed] no coordinates for "${city}" (${c.name}); storing null`);
    }
    await pool.query(UPSERT, [
      c.name,
      city,
      c.location.countryCode ?? null,
      c.budget ?? null,
      c.note ?? null,
      coord?.lat ?? null,
      coord?.lon ?? null,
    ]);
  }

  const { rows } = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::int AS count FROM customers",
  );
  console.log(
    `[seed] upserted ${customers.length} customers (geocoded=${geocoded}, unknown=${unknown}); table now has ${rows[0]?.count} rows`,
  );
}

seed()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("[seed] failed:", err);
    await pool.end();
    process.exit(1);
  });
