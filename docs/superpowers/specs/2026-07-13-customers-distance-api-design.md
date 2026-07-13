# Customers Distance API — Design Spec

**Date:** 2026-07-13
**Branch:** `harness/superpowers`
**Status:** Approved (brainstorming)

## Goal

A small, self-contained REST service over Postgres that seeds 15 customers from
`seed-customers.json`, geocodes each customer's city to lat/lon from a local
bundled reference (no external calls), and exposes two GET endpoints: a count
and a list ordered by distance from Budapest.

## Constraints (verbatim from the assignment)

- Must run **offline**: no external geocoding API, no LLM calls at runtime.
- Idempotent seed: running it twice must not duplicate rows.
- City matching must be robust: accent-insensitive, case-insensitive, trimmed
  whitespace. "Budapest" (and optionally its districts) maps to the capital.
- Unknown city → `lat/lon = null`. Not an error: log and continue.
- `distanceKm` rounded to 1 decimal place.
- Unit test for the haversine distance (a known distance e.g. Budapest–Vienna
  ~214 km, the 0 km case, and null-coordinate handling).
- Small, focused commits. README for running. Bind the Postgres MCP.

## Tech Stack

- Node.js + TypeScript, ES modules
- Express (HTTP), `node-postgres` (`pg`)
- Vitest (unit tests)
- Docker Compose (Postgres 16) for local/offline runtime
- `tsx` to run TypeScript directly (dev, migrate, seed, start)

## Architecture

Chosen approach: **distance + sorting in the application layer** (approach A).
The database only stores `lat`/`lon`; haversine and ordering are pure TypeScript
functions. This makes the required haversine unit test trivial, keeps the DB
simple (no extensions), stays fully offline, and lets the sorting rules be
tested in isolation without a database.

### File structure

```
src/
  config.ts              # env config (DATABASE_URL, PORT)
  geo/
    distance.ts          # haversine + distance-from-Budapest (pure)
    reference.ts         # city -> lat/lon reference + normalization (pure)
  customers.ts           # by-distance mapping + sorting (pure)
  db/
    pool.ts              # pg Pool
    migrate.ts           # migration runner
    migrations/001_init.sql
  repository.ts          # count + by-distance queries
  app.ts                 # Express app + routes
  server.ts              # entrypoint
test/
  distance.test.ts
  reference.test.ts
  customers.test.ts
```

## Data Model

Table `customers`:

| column       | type             | notes                        |
|--------------|------------------|------------------------------|
| id           | SERIAL PK        |                              |
| name         | TEXT NOT NULL    |                              |
| telepules    | TEXT NOT NULL    | the city (location.city)     |
| country_code | TEXT             | optional                     |
| budget       | INTEGER          | optional                     |
| note         | TEXT             | optional                     |
| lat          | DOUBLE PRECISION | nullable (unknown city)      |
| lon          | DOUBLE PRECISION | nullable (unknown city)      |

`UNIQUE(name, telepules)` is the natural key that makes the seed idempotent
(`INSERT ... ON CONFLICT (name, telepules) DO UPDATE`).

## Geocoding (offline)

- A bundled `CITY_COORDS` map keyed by the normalized city name, covering all 15
  cities present in the seed, with known coordinates.
- `normalizeCity(raw)`: `NFD` normalize → strip diacritics → `toLowerCase` →
  `trim` → collapse internal whitespace.
- `lookupCoord(city)`: exact match on normalized key; if the normalized key
  contains "budapest" (districts, postal-prefixed forms), map to the capital;
  otherwise `null`.
- Reference point: Budapest `{ lat: 47.4979, lon: 19.0402 }`.

Seed cities (English names as in the seed): Budapest, Vienna, Munich, Milan,
Barcelona, Lyon, Kraków, Prague, Lisbon, Amsterdam, Stockholm, Ljubljana,
Bucharest, Dublin, Copenhagen.

## Endpoints

- `GET /health` → `{ "status": "ok" }` (convenience)
- `GET /customers/count` → `{ "count": <int> }` (matches actual row count)
- `GET /customers/by-distance` → array, ascending distance from Budapest:
  - each element: `{ id, name, telepules, countryCode, budget, distanceKm }`
  - `distanceKm` rounded to 1 decimal; Budapest customers first at `0`
  - unknown-coordinate customers last with `distanceKm: null`
  - ties broken by `name`

## Error Handling

- Express routes wrap handlers in try/catch and delegate to a central error
  handler that returns HTTP 500 with `{ "error": "internal_server_error" }`.
- Seed logs any unknown city and continues (never crashes).

## Testing (TDD, RED → GREEN)

- `distance.test.ts`: Budapest–Vienna ~214 km; 0 km for Budapest; `null` for
  missing coordinates; rounding to one decimal.
- `reference.test.ts`: accent/case/whitespace-insensitive matching; Budapest +
  district; unknown/empty → null.
- `customers.test.ts`: Budapest first (0), ascending distances, unknown last
  (null), ties by name.

## Operations

- `docker-compose.yml`: Postgres 16, host port **5433** (avoids clashing with a
  local 5432), healthcheck.
- npm scripts: `db:up`, `db:down`, `migrate`, `seed`, `dev`, `start`, `test`.
- `.env.example` mirrors the Compose defaults; `DATABASE_URL` default
  `postgres://app:app@localhost:5433/customers`.
- `seed-customers.json` copied into the repo.
- **Postgres MCP**: a project-scoped `.mcp.json` at the repo root, consumed by a
  Claude app, running `@modelcontextprotocol/server-postgres` via `npx` against
  the Compose DB (`postgres://app:app@localhost:5433/customers`).
- README documents: Postgres start, migration, seed, server, tests.

## Out of Scope (YAGNI)

Auth, write endpoints beyond the seed, frontend, external geocoding, LLM,
pagination, and scaling for large datasets (only 15 rows).
