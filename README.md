# Customers Distance Service — BMAD arm

A small, self-contained REST service over PostgreSQL that seeds 15 customers from
`seed-customers.json`, geocodes each city with a **local, offline** reference (no
external geocoding API, no runtime LLM), and serves a count and a
Budapest-distance-sorted customer list.

This is the **BMAD-METHOD arm** of a harness comparison. The same scope was built on
the `harness/superpowers` branch with the Superpowers workflow; here it is rebuilt
with BMAD (PRD → Architecture → Epics/Stories → Sprint → per-story TDD). See the
artifact trail under [`_bmad-output/`](_bmad-output/).

## Tech stack

Node.js + TypeScript (ESM, run via `tsx`), Express 5, node-postgres (`pg`), Vitest,
Docker Compose (PostgreSQL 16).

## Prerequisites

- Node.js 18+
- Docker (for the PostgreSQL container)

## Quickstart

```bash
npm install          # install dependencies

npm run db:up        # start PostgreSQL 16 (Docker, host port 5433)
npm run migrate      # create the customers table
npm run seed         # load + geocode the 15 customers (idempotent — safe to re-run)

npm start            # start the API on http://localhost:3000
npm test             # run the full unit/integration suite
```

Stop the database with `npm run db:down`.

Configuration (optional) via env or `.env` (defaults match Docker Compose):

```
DATABASE_URL=postgres://app:app@localhost:5433/customers
PORT=3000
```

## Endpoints

| Method | Path | Response |
| --- | --- | --- |
| GET | `/health` | `{ "status": "ok" }` |
| GET | `/customers/count` | `{ "count": 15 }` |
| GET | `/customers/by-distance` | customers ascending by distance from Budapest |

`/customers/by-distance` returns each customer with `distanceKm` (1 decimal).
Budapest customers come first (`0`), unknown-coordinate customers last
(`distanceKm: null`), ties broken by `name`.

Example:

```bash
curl http://localhost:3000/customers/count
curl http://localhost:3000/customers/by-distance
```

## How it works

- **Offline geocoding** — `src/geo/reference.ts` maps each seed city to known
  coordinates. Matching is accent-/case-insensitive and whitespace-tolerant;
  "Budapest" and its districts resolve to the capital. Unknown cities store
  `lat/lon = null` (logged, non-fatal).
- **Distance** — `src/geo/distance.ts` is a pure, unit-tested haversine from Budapest
  (`47.4979, 19.0402`), rounded to 1 decimal.
- **Idempotent seed** — `customers` has `UNIQUE(name, telepules)`; the seed upserts
  with `ON CONFLICT DO UPDATE`, so re-running never duplicates rows.
- **Layered design** — pure domain (`geo/`, `customers.ts`) has no IO; the database
  and HTTP are thin adapters (see `_bmad-output/planning-artifacts/architecture/`).

## Tests

```bash
npm test
```

Covers the distance domain (haversine: Budapest–Vienna ≈ 214 km, 0 km self-distance,
null handling), the offline reference/normalization, the by-distance ordering, and the
HTTP endpoints (count, ordering, health, 500 error shape).

## Postgres MCP (Claude app)

`.mcp.json` (project-scoped) configures a Postgres MCP server so a **Claude** app can
inspect the schema and data during development:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgres://app:app@localhost:5433/customers"]
    }
  }
}
```

Start the database (`npm run db:up`) and run the migration/seed first, then open the
project in the Claude app to browse `customers`.

## BMAD artifact trail

- `_bmad-output/planning-artifacts/` — product brief, PRD, architecture spine, epics &
  stories, implementation-readiness report.
- `_bmad-output/implementation-artifacts/` — `sprint-status.yaml` and the six story
  files (each with tasks, dev notes, and a senior-developer review).
