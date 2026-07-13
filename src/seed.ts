import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db/pool";
import { lookupCoord } from "./geo/reference";

const seedPath = join(dirname(fileURLToPath(import.meta.url)), "..", "seed-customers.json");

interface SeedCustomer {
  name: string;
  budget?: number;
  location?: { city?: string; countryCode?: string };
  note?: string;
}

async function seed(): Promise<void> {
  const raw = await readFile(seedPath, "utf8");
  const customers: SeedCustomer[] = JSON.parse(raw);
  let upserted = 0;
  let withoutCoords = 0;

  for (const customer of customers) {
    const city = customer.location?.city ?? "";
    const coord = lookupCoord(city);
    if (!coord) {
      withoutCoords += 1;
      console.warn(`No coordinates for city "${city}" (customer: ${customer.name}) -> lat/lon = null`);
    }
    await pool.query(
      `INSERT INTO customers (name, telepules, country_code, budget, note, lat, lon)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (name, telepules) DO UPDATE
       SET country_code = EXCLUDED.country_code,
           budget       = EXCLUDED.budget,
           note         = EXCLUDED.note,
           lat          = EXCLUDED.lat,
           lon          = EXCLUDED.lon`,
      [
        customer.name,
        city,
        customer.location?.countryCode ?? null,
        customer.budget ?? null,
        customer.note ?? null,
        coord?.lat ?? null,
        coord?.lon ?? null,
      ],
    );
    upserted += 1;
  }
  console.log(`Seed complete: ${upserted} customers upserted, ${withoutCoords} without coordinates.`);
}

try {
  await seed();
} catch (error) {
  console.error("seed failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
