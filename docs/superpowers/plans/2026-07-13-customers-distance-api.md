# Customers Distance API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline REST service over Postgres that idempotently seeds 15 geocoded customers and serves a count and a Budapest-distance-sorted list.

**Architecture:** Distance and sorting live in pure TypeScript functions (approach A); the database only stores coordinates. Express exposes the endpoints; `pg` talks to a Dockerized Postgres. Pure modules are unit-tested without a database.

**Tech Stack:** Node.js + TypeScript (ESM), Express, node-postgres (`pg`), Vitest, Docker Compose (Postgres 16), tsx.

## Global Constraints

- Runs offline: no external geocoding API, no LLM at runtime.
- Idempotent seed: re-running never duplicates rows (`UNIQUE(name, telepules)` + `ON CONFLICT`).
- City matching: accent-insensitive, case-insensitive, trimmed, whitespace-collapsed; "Budapest" and districts map to the capital.
- Unknown city → `lat/lon = null`; log and continue, never crash.
- `distanceKm` rounded to 1 decimal.
- `GET /customers/count` → `{ "count": <int> }`; `GET /customers/by-distance` → ascending distance, Budapest first (0), unknown last (`null`), ties by `name`.
- Reference point Budapest: `{ lat: 47.4979, lon: 19.0402 }`.
- Small, focused commits.

---

### Task 1: Project scaffolding & tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `docker-compose.yml`, `.env.example`
- Modify: `.gitignore`
- Copy: `seed-customers.json` (from the parent folder into the repo root)

**Interfaces:**
- Produces: npm scripts `db:up`, `db:down`, `migrate`, `seed`, `dev`, `start`, `test`; a Postgres reachable at `postgres://app:app@localhost:5433/customers`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "harness-comparison-superpowers",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "migrate": "tsx src/db/migrate.ts",
    "seed": "tsx src/seed.ts",
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "@types/express": "^5.0.3",
    "@types/node": "^24.10.1",
    "@types/pg": "^8.15.6",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: harness_superpowers_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: customers
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d customers"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

- [ ] **Step 5: Create `.env.example`**

```
DATABASE_URL=postgres://app:app@localhost:5433/customers
PORT=3000
```

- [ ] **Step 6: Update `.gitignore`** (append node artifacts and env)

```
# Editor / local tooling
.cursor/

# Node
node_modules/
dist/

# Env
.env

# Logs
*.log
npm-debug.log*

# Superpowers SDD scratch (briefs, reports, diffs, ledger)
.superpowers/
```

- [ ] **Step 7: Copy the seed file into the repo**

```powershell
Copy-Item "..\seed-customers.json" ".\seed-customers.json"
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: dependencies installed, `node_modules/` present.

- [ ] **Step 9: Verify tooling & commit**

Run: `npx tsc --noEmit` → Expected: exit 0 (no files yet, no errors).
```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts docker-compose.yml .env.example .gitignore seed-customers.json
git commit -m "chore(superpowers): scaffold Node+TS+Express project with Docker Postgres"
```

---

### Task 2: Haversine distance module (TDD)

**Files:**
- Create: `src/geo/distance.ts`
- Test: `test/distance.test.ts`

**Interfaces:**
- Produces: `interface Coord { lat: number; lon: number }`; `const BUDAPEST: Coord`; `haversineKm(a: Coord, b: Coord): number`; `distanceFromBudapestKm(coord: { lat: number|null; lon: number|null } | null | undefined): number | null`; `roundToOneDecimal(value: number): number`.

- [ ] **Step 1: Write the failing test** — `test/distance.test.ts`

```ts
import { describe, it, expect } from "vitest";
import {
  BUDAPEST,
  distanceFromBudapestKm,
  haversineKm,
  roundToOneDecimal,
} from "../src/geo/distance";

const VIENNA = { lat: 48.2082, lon: 16.3738 };

describe("haversineKm", () => {
  it("computes a known distance (Budapest - Vienna ~ 214 km)", () => {
    const d = haversineKm(BUDAPEST, VIENNA);
    expect(d).toBeGreaterThan(210);
    expect(d).toBeLessThan(218);
  });

  it("is zero for the same point (Budapest - Budapest)", () => {
    expect(haversineKm(BUDAPEST, BUDAPEST)).toBe(0);
  });

  it("is symmetric", () => {
    expect(haversineKm(BUDAPEST, VIENNA)).toBeCloseTo(haversineKm(VIENNA, BUDAPEST), 6);
  });
});

describe("distanceFromBudapestKm", () => {
  it("returns 0 for Budapest itself", () => {
    expect(distanceFromBudapestKm(BUDAPEST)).toBe(0);
  });

  it("returns ~214 for Vienna", () => {
    const d = distanceFromBudapestKm(VIENNA);
    expect(d).not.toBeNull();
    expect(roundToOneDecimal(d as number)).toBeCloseTo(214, 0);
  });

  it("returns null when the coordinate is missing", () => {
    expect(distanceFromBudapestKm(null)).toBeNull();
    expect(distanceFromBudapestKm(undefined)).toBeNull();
    expect(distanceFromBudapestKm({ lat: null, lon: null })).toBeNull();
    expect(distanceFromBudapestKm({ lat: 47.5, lon: null })).toBeNull();
    expect(distanceFromBudapestKm({ lat: null, lon: 19.0 })).toBeNull();
  });
});

describe("roundToOneDecimal", () => {
  it("rounds to a single decimal place", () => {
    expect(roundToOneDecimal(213.94)).toBe(213.9);
    expect(roundToOneDecimal(213.95)).toBe(214);
    expect(roundToOneDecimal(0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL (cannot resolve `../src/geo/distance`).

- [ ] **Step 3: Write minimal implementation** — `src/geo/distance.ts`

```ts
export interface Coord {
  lat: number;
  lon: number;
}

export const BUDAPEST: Coord = { lat: 47.4979, lon: 19.0402 };

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(a: Coord, b: Coord): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function distanceFromBudapestKm(
  coord: { lat: number | null; lon: number | null } | null | undefined,
): number | null {
  if (!coord || coord.lat === null || coord.lon === null) {
    return null;
  }
  return haversineKm(BUDAPEST, { lat: coord.lat, lon: coord.lon });
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test` → Expected: PASS (distance tests green).

- [ ] **Step 5: Commit**

```bash
git add src/geo/distance.ts test/distance.test.ts
git commit -m "feat(geo): haversine distance from Budapest with tests"
```

---

### Task 3: City reference + normalization (TDD)

**Files:**
- Create: `src/geo/reference.ts`
- Test: `test/reference.test.ts`

**Interfaces:**
- Consumes: `Coord` from `src/geo/distance.ts`.
- Produces: `normalizeCity(raw: string): string`; `lookupCoord(city: string | null | undefined): Coord | null`.

- [ ] **Step 1: Write the failing test** — `test/reference.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { lookupCoord, normalizeCity } from "../src/geo/reference";

describe("normalizeCity", () => {
  it("is case-insensitive and trims/collapses whitespace", () => {
    expect(normalizeCity("  BUDAPEST  ")).toBe("budapest");
    expect(normalizeCity("New   York")).toBe("new york");
  });
  it("strips accents", () => {
    expect(normalizeCity("Kraków")).toBe("krakow");
    expect(normalizeCity("Bécs")).toBe("becs");
  });
});

describe("lookupCoord", () => {
  it("finds known cities regardless of case/whitespace", () => {
    expect(lookupCoord("Vienna")).toEqual({ lat: 48.2082, lon: 16.3738 });
    expect(lookupCoord("  amsterdam ")).toEqual({ lat: 52.3676, lon: 4.9041 });
  });
  it("matches accented city names", () => {
    expect(lookupCoord("Kraków")).toEqual({ lat: 50.0647, lon: 19.945 });
  });
  it("maps Budapest and its districts to the capital", () => {
    const bp = { lat: 47.4979, lon: 19.0402 };
    expect(lookupCoord("Budapest")).toEqual(bp);
    expect(lookupCoord("Budapest XI. kerület")).toEqual(bp);
    expect(lookupCoord("1094 Budapest")).toEqual(bp);
  });
  it("returns null for unknown or empty cities", () => {
    expect(lookupCoord("Atlantis")).toBeNull();
    expect(lookupCoord("")).toBeNull();
    expect(lookupCoord(null)).toBeNull();
    expect(lookupCoord(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test` → Expected: FAIL (cannot resolve `../src/geo/reference`).

- [ ] **Step 3: Write minimal implementation** — `src/geo/reference.ts`

```ts
import type { Coord } from "./distance";

const CITY_COORDS: Record<string, Coord> = {
  budapest: { lat: 47.4979, lon: 19.0402 },
  vienna: { lat: 48.2082, lon: 16.3738 },
  munich: { lat: 48.1351, lon: 11.582 },
  milan: { lat: 45.4642, lon: 9.19 },
  barcelona: { lat: 41.3874, lon: 2.1686 },
  lyon: { lat: 45.764, lon: 4.8357 },
  krakow: { lat: 50.0647, lon: 19.945 },
  prague: { lat: 50.0755, lon: 14.4378 },
  lisbon: { lat: 38.7223, lon: -9.1393 },
  amsterdam: { lat: 52.3676, lon: 4.9041 },
  stockholm: { lat: 59.3293, lon: 18.0686 },
  ljubljana: { lat: 46.0569, lon: 14.5058 },
  bucharest: { lat: 44.4268, lon: 26.1025 },
  dublin: { lat: 53.3498, lon: -6.2603 },
  copenhagen: { lat: 55.6761, lon: 12.5683 },
};

export function normalizeCity(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function lookupCoord(city: string | null | undefined): Coord | null {
  if (!city) {
    return null;
  }
  const key = normalizeCity(city);
  if (key in CITY_COORDS) {
    return CITY_COORDS[key];
  }
  if (key.includes("budapest")) {
    return CITY_COORDS.budapest;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/geo/reference.ts test/reference.test.ts
git commit -m "feat(geo): local offline city geocoding reference with tests"
```

---

### Task 4: Customers by-distance mapping + sorting (TDD)

**Files:**
- Create: `src/customers.ts`
- Test: `test/customers.test.ts`

**Interfaces:**
- Consumes: `distanceFromBudapestKm`, `roundToOneDecimal` from `src/geo/distance.ts`.
- Produces: `interface CustomerRow { id: number; name: string; telepules: string; country_code: string|null; budget: number|null; lat: number|null; lon: number|null }`; `interface CustomerDistanceDto { id; name; telepules; countryCode: string|null; budget: number|null; distanceKm: number|null }`; `toDistanceDto(row: CustomerRow): CustomerDistanceDto`; `sortByDistanceThenName(list: CustomerDistanceDto[]): CustomerDistanceDto[]`; `buildByDistanceList(rows: CustomerRow[]): CustomerDistanceDto[]`.

- [ ] **Step 1: Write the failing test** — `test/customers.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildByDistanceList, type CustomerRow } from "../src/customers";

const rows: CustomerRow[] = [
  { id: 1, name: "Vienna Guy", telepules: "Vienna", country_code: "AT", budget: 100, lat: 48.2082, lon: 16.3738 },
  { id: 2, name: "Anna Budapest", telepules: "Budapest", country_code: "HU", budget: 200, lat: 47.4979, lon: 19.0402 },
  { id: 3, name: "Unknown Two", telepules: "Atlantis", country_code: "XX", budget: 0, lat: null, lon: null },
  { id: 4, name: "Unknown One", telepules: "Nowhere", country_code: "XX", budget: 0, lat: null, lon: null },
  { id: 5, name: "Bela Budapest", telepules: "Budapest", country_code: "HU", budget: 300, lat: 47.4979, lon: 19.0402 },
];

describe("buildByDistanceList", () => {
  const result = buildByDistanceList(rows);

  it("puts Budapest customers first with distanceKm 0", () => {
    expect(result[0].distanceKm).toBe(0);
    expect(result[1].distanceKm).toBe(0);
  });
  it("breaks ties (equal distance) by name", () => {
    expect(result[0].name).toBe("Anna Budapest");
    expect(result[1].name).toBe("Bela Budapest");
  });
  it("orders known distances ascending", () => {
    const known = result.map((c) => c.distanceKm).filter((d): d is number => d !== null);
    expect(known).toEqual([...known].sort((a, b) => a - b));
  });
  it("places unknown-coordinate customers last with distanceKm null, sorted by name", () => {
    const lastTwo = result.slice(-2);
    expect(lastTwo.map((c) => c.distanceKm)).toEqual([null, null]);
    expect(lastTwo.map((c) => c.name)).toEqual(["Unknown One", "Unknown Two"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test` → Expected: FAIL (cannot resolve `../src/customers`).

- [ ] **Step 3: Write minimal implementation** — `src/customers.ts`

```ts
import { distanceFromBudapestKm, roundToOneDecimal } from "./geo/distance";

export interface CustomerRow {
  id: number;
  name: string;
  telepules: string;
  country_code: string | null;
  budget: number | null;
  lat: number | null;
  lon: number | null;
}

export interface CustomerDistanceDto {
  id: number;
  name: string;
  telepules: string;
  countryCode: string | null;
  budget: number | null;
  distanceKm: number | null;
}

export function toDistanceDto(row: CustomerRow): CustomerDistanceDto {
  const distance = distanceFromBudapestKm({ lat: row.lat, lon: row.lon });
  return {
    id: row.id,
    name: row.name,
    telepules: row.telepules,
    countryCode: row.country_code,
    budget: row.budget,
    distanceKm: distance === null ? null : roundToOneDecimal(distance),
  };
}

export function sortByDistanceThenName(
  customers: CustomerDistanceDto[],
): CustomerDistanceDto[] {
  return [...customers].sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return a.name.localeCompare(b.name);
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    return a.name.localeCompare(b.name);
  });
}

export function buildByDistanceList(rows: CustomerRow[]): CustomerDistanceDto[] {
  return sortByDistanceThenName(rows.map(toDistanceDto));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test` → Expected: PASS (all 3 test files green).

- [ ] **Step 5: Commit**

```bash
git add src/customers.ts test/customers.test.ts
git commit -m "feat(customers): by-distance mapping and sorting with tests"
```

---

### Task 5: DB config, pool & migration

**Files:**
- Create: `src/config.ts`, `src/db/pool.ts`, `src/db/migrations/001_init.sql`, `src/db/migrate.ts`

**Interfaces:**
- Produces: `config.databaseUrl`, `config.port`; `pool` (a `pg.Pool`); a `customers` table with `UNIQUE(name, telepules)`.

- [ ] **Step 1: Create `src/config.ts`**

```ts
import "dotenv/config";

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://app:app@localhost:5433/customers",
  port: Number(process.env.PORT ?? 3000),
};
```

- [ ] **Step 2: Create `src/db/pool.ts`**

```ts
import pg from "pg";
import { config } from "../config";

export const pool = new pg.Pool({ connectionString: config.databaseUrl });
```

- [ ] **Step 3: Create `src/db/migrations/001_init.sql`**

```sql
CREATE TABLE IF NOT EXISTS customers (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    telepules    TEXT NOT NULL,
    country_code TEXT,
    budget       INTEGER,
    note         TEXT,
    lat          DOUBLE PRECISION,
    lon          DOUBLE PRECISION,
    CONSTRAINT customers_name_telepules_key UNIQUE (name, telepules)
);
```

- [ ] **Step 4: Create `src/db/migrate.ts`**

```ts
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
```

- [ ] **Step 5: Verify against a running DB**

Run: `npm run db:up` (wait until healthy) then `npm run migrate`
Expected: `applied migration: 001_init.sql` / `migrations complete`.

- [ ] **Step 6: Commit**

```bash
git add src/config.ts src/db/pool.ts src/db/migrate.ts src/db/migrations/001_init.sql
git commit -m "feat(db): config, connection pool and customers migration"
```

---

### Task 6: Idempotent geocoded seed

**Files:**
- Create: `src/seed.ts`

**Interfaces:**
- Consumes: `pool`, `lookupCoord`; reads `seed-customers.json` from repo root.
- Produces: 15 upserted rows; re-run yields the same 15 rows.

- [ ] **Step 1: Create `src/seed.ts`**

```ts
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
```

- [ ] **Step 2: Verify idempotency**

Run: `npm run seed` twice.
Expected: both runs print `Seed complete: 15 customers upserted, 0 without coordinates.`; row count stays 15.

- [ ] **Step 3: Commit**

```bash
git add src/seed.ts
git commit -m "feat(seed): idempotent geocoded seed from seed-customers.json"
```

---

### Task 7: Repository (count + by-distance)

**Files:**
- Create: `src/repository.ts`

**Interfaces:**
- Consumes: `pool`, `buildByDistanceList`, `CustomerRow`, `CustomerDistanceDto`.
- Produces: `countCustomers(): Promise<number>`; `customersByDistance(): Promise<CustomerDistanceDto[]>`.

- [ ] **Step 1: Create `src/repository.ts`**

```ts
import { pool } from "./db/pool";
import { buildByDistanceList, type CustomerDistanceDto, type CustomerRow } from "./customers";

export async function countCustomers(): Promise<number> {
  const result = await pool.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM customers",
  );
  return result.rows[0].count;
}

export async function customersByDistance(): Promise<CustomerDistanceDto[]> {
  const result = await pool.query<CustomerRow>(
    "SELECT id, name, telepules, country_code, budget, lat, lon FROM customers",
  );
  return buildByDistanceList(result.rows);
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit` → Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/repository.ts
git commit -m "feat(repository): count and by-distance queries"
```

---

### Task 8: Express app, endpoints & server

**Files:**
- Create: `src/app.ts`, `src/server.ts`

**Interfaces:**
- Consumes: `countCustomers`, `customersByDistance`, `config`, `pool`.
- Produces: `createApp()` returning an Express app with `/health`, `/customers/count`, `/customers/by-distance`; `server.ts` entrypoint.

- [ ] **Step 1: Create `src/app.ts`**

```ts
import express, { type NextFunction, type Request, type Response } from "express";
import { countCustomers, customersByDistance } from "./repository";

export function createApp() {
  const app = express();

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/customers/count", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ count: await countCustomers() });
    } catch (error) {
      next(error);
    }
  });

  app.get("/customers/by-distance", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await customersByDistance());
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "internal_server_error" });
  });

  return app;
}
```

- [ ] **Step 2: Create `src/server.ts`**

```ts
import { createApp } from "./app";
import { config } from "./config";
import { pool } from "./db/pool";

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`listening on http://localhost:${config.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received, shutting down...`);
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
```

- [ ] **Step 3: Verify endpoints end-to-end**

Run: `npm start`, then in another shell:
- `curl http://localhost:3000/customers/count` → Expected: `{"count":15}`
- `curl http://localhost:3000/customers/by-distance` → Expected: JSON array, first element Budapest with `"distanceKm":0`, Vienna `~214`, unknown (if any) last with `null`.

- [ ] **Step 4: Commit**

```bash
git add src/app.ts src/server.ts
git commit -m "feat(api): express app with count and by-distance endpoints"
```

---

### Task 9: Postgres MCP config, README & final verification

**Files:**
- Create: `.mcp.json` (Claude Code project-scoped MCP config at repo root — committable)
- Modify: `README.md`

**Interfaces:**
- Produces: a Postgres MCP config entry (for a Claude app) pointing at the Compose DB; README run instructions.

**Decision:** The Postgres MCP is consumed by a Claude application (not Cursor).
Claude Code reads a project-scoped `.mcp.json` at the repo root, which is NOT
gitignored (unlike `.cursor/`), so it is committed with the repo.

- [ ] **Step 1: Create `.mcp.json`** at the repo root

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgres://app:app@localhost:5433/customers"
      ]
    }
  }
}
```
The `@modelcontextprotocol/server-postgres` server exposes read-only schema and
query access, matching the goal of inspecting the schema and data during
development. It runs via `npx` (no Docker image needed).

- [ ] **Step 2: Update `README.md`** with concrete run instructions

Document: `npm install` → `npm run db:up` → `npm run migrate` → `npm run seed` → `npm start`; `npm test`; endpoint examples; note the Postgres MCP must be enabled in Cursor.

- [ ] **Step 3: Full verification**

Run: `npm test` (all green), `npx tsc --noEmit` (exit 0), and the endpoint checks from Task 8.

- [ ] **Step 4: Commit**

```bash
git add .mcp.json README.md
git commit -m "docs: Postgres MCP config (Claude) and run instructions"
```

- [ ] **Step 5: Push branch**

```bash
git push origin harness/superpowers
```

---

## Self-Review

**1. Spec coverage:**
- Offline, no external calls → Tasks 3, 6 (local reference). ✓
- Seed in repo → Task 1 Step 7. ✓
- Data model (id, name, telepules, lat/lon nullable; budget/note optional) → Task 5 migration. ✓
- Idempotent seed → Task 6 (`ON CONFLICT`). ✓
- Robust matching (accent/case/trim; Budapest districts) → Task 3. ✓
- Unknown city → null, log, continue → Tasks 3 + 6. ✓
- `/customers/count` and `/customers/by-distance` semantics → Tasks 7, 8. ✓
- Haversine unit test (~214, 0, null) → Task 2. ✓
- Small focused commits → every task ends with a commit. ✓
- README run instructions → Task 9. ✓
- Postgres MCP bound → Task 9. ✓

**2. Placeholder scan:** No TBD/TODO; all steps contain concrete code/commands. ✓

**3. Type consistency:** `Coord`, `CustomerRow`, `CustomerDistanceDto`, and function signatures are consistent across tasks (distance → reference → customers → repository → app). ✓

**Note (MCP for Claude):** The Postgres MCP is consumed by a Claude app, configured via a project-scoped `.mcp.json` at the repo root (Task 9). This is not under `.cursor/`, so it is committed with the repo — no gitignore conflict.
