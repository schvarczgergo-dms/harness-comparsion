# Harness Comparison — Superpowers branch

An offline REST service over PostgreSQL that seeds 15 geocoded customers and
serves a count plus a Budapest-distance-sorted list. Built on the
`harness/superpowers` branch using the Superpowers workflow (brainstorm →
plan → subagent-driven TDD execution).

Design spec: `docs/superpowers/specs/2026-07-13-customers-distance-api-design.md`
Implementation plan: `docs/superpowers/plans/2026-07-13-customers-distance-api.md`

## What it does

- Loads `seed-customers.json` (15 customers) idempotently into Postgres.
- Geocodes each customer's city with a **local, bundled** `city -> lat/lon`
  reference — no external geocoding API, no LLM at runtime.
- City matching is accent-insensitive, case-insensitive and whitespace-tolerant;
  "Budapest" and its districts map to the capital. Unknown cities get
  `lat/lon = null` (logged, not a crash).
- Computes great-circle distances from Budapest with the haversine formula
  (unit-tested).

## Tech stack

Node.js + TypeScript (ESM), Express 5, node-postgres (`pg`), Vitest, Docker
Compose (Postgres 16), tsx.

## Prerequisites

- Node.js 18+ (uses `Object.hasOwn`, ES2022)
- Docker Desktop (for the Postgres container)

## Setup & run

```bash
# 1. Install dependencies
npm install

# 2. (optional) copy env defaults; the app falls back to these anyway
cp .env.example .env

# 3. Start PostgreSQL (Docker, host port 5433)
npm run db:up

# 4. Create the schema
npm run migrate

# 5. Load the seed (idempotent — safe to run repeatedly)
npm run seed

# 6. Start the server (http://localhost:3000)
npm start
# or: npm run dev   (watch mode)
```

Stop the database with `npm run db:down`.

## Endpoints

- `GET /health` → `{ "status": "ok" }`
- `GET /customers/count` → `{ "count": 15 }`
- `GET /customers/by-distance` → array of customers sorted by ascending
  distance from Budapest. Budapest customers first (`distanceKm: 0`), unknown
  coordinates last (`distanceKm: null`), ties broken by name. `distanceKm` is
  rounded to 1 decimal.

Example:

```bash
curl http://localhost:3000/customers/count
curl http://localhost:3000/customers/by-distance
```

## Tests

```bash
npm test        # run once
npm run test:watch
```

Unit tests cover the haversine distance (Budapest–Vienna ≈ 214 km, the 0 km
self-distance, and null-coordinate handling), the city normalization/lookup,
and the by-distance mapping and sorting.

## Postgres MCP (for a Claude app)

`.mcp.json` at the repo root configures a project-scoped Postgres MCP server so
a Claude application can inspect the schema and data during development. It runs
`@modelcontextprotocol/server-postgres` via `npx` against the Compose database
(`postgres://app:app@localhost:5433/customers`). Start the database
(`npm run db:up`) before using it.
