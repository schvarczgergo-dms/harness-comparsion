---
title: Customers Distance Service
status: final
created: 2026-07-13
updated: 2026-07-13
author: John (Product Manager)
communication_language: English
---

# PRD: Customers Distance Service
*Working title — confirm.*

## 0. Document Purpose

This PRD is for the downstream BMAD workflow owners (Architect, Scrum Master, Dev)
building the **BMAD arm** of a harness comparison. It builds on the Product Brief
(`_bmad-output/planning-artifacts/product-brief/brief.md`). It describes *what* the
service must do as globally-numbered Functional Requirements with testable
consequences; *how* (language, framework, DB engine) is deliberately deferred to the
Architecture workflow. Vocabulary is fixed in the Glossary and used verbatim.

## 1. Vision

A tiny, self-contained REST service over a relational database that answers two
questions about a fixed set of 15 seeded customers: *how many are there* and *which
are closest to Budapest*. It must run fully **offline** — no external geocoding API
and no LLM calls at runtime — so results are deterministic and reproducible in CI.
Its value is as a controlled, identical-scope benchmark against the Superpowers arm,
making the two agentic development methodologies comparable on the same task.

## 2. Target User

### 2.1 Jobs To Be Done
- As the **course reviewer**, evaluate a BMAD-built backend against the Superpowers
  one on identical requirements.
- As a **developer**, run the service locally offline and get a correct count and a
  Budapest-distance-sorted customer list from seed data.
- As the **builder (me)**, demonstrate the full BMAD process (PRD → Architecture →
  Stories → TDD) with a visible artifact trail.

### 2.2 Non-Users (v1)
- End consumers / a UI audience — there is no UI.
- Any caller needing to create/update customers — the API is read-only.

### 2.3 Key User Journeys
- **UJ-1. Reviewer verifies the service offline.** The reviewer clones the repo,
  starts the database, runs migration + seed, starts the server, and calls
  `GET /customers/count` (expects 15) and `GET /customers/by-distance` (expects
  Budapest customers first at 0 km, ascending distances, unknown-coordinate
  customers last with `null`). No network access is required at any point.

## 3. Glossary

- **Customer** — A seeded record: `name`, `telepules` (city/town), optional
  `budget`, optional `note`, optional `country_code`, and nullable `lat`/`lon`.
- **telepules** — The customer's city/town (from `location.city` in the seed). The
  canonical domain term for "city" throughout this document and downstream code.
- **Reference (geocoding reference)** — A repo-bundled, offline map from a
  normalized `telepules` to known `{lat, lon}` coordinates.
- **Normalization** — Deterministic transform of a `telepules` string for matching:
  accent-stripped, lowercased, trimmed, internal whitespace collapsed.
- **distanceKm** — Great-circle (haversine) distance in kilometers from Budapest to
  a customer's coordinates, rounded to 1 decimal; `null` when coordinates are unknown.
- **Budapest reference point** — The fixed origin for distance: `lat 47.4979,
  lon 19.0402`.
- **Idempotent seed** — Loading the seed any number of times yields the same set of
  rows (no duplicates).

## 4. Features

### 4.1 Offline data ingestion & geocoding

**Description:** A loader reads the bundled `seed-customers.json` (15 customers) and
upserts each into the `customers` store, assigning coordinates from the offline
Reference. Matching uses Normalization; "Budapest" and its districts resolve to the
Budapest reference point. Unknown cities are stored with `lat/lon = null`. Realizes
UJ-1. Uses Glossary terms exactly.

**Functional Requirements:**

#### FR-1: Idempotent seed load
The loader can ingest all customers from `seed-customers.json` into the store.
**Consequences (testable):**
- After one run, the store contains exactly 15 customers.
- Running the loader twice results in the same 15 rows (no duplicates); the row
  count remains 15.

#### FR-2: Offline geocoding from a bundled reference
The loader assigns `lat/lon` to each customer from a repo-bundled `telepules → {lat,lon}`
Reference covering every city in the seed. No network or LLM call occurs.
**Consequences (testable):**
- Every seed city resolves to coordinates from the Reference (0 unknowns for the
  given seed).
- No outbound network request is made during seeding.

#### FR-3: Robust city matching
Matching a `telepules` to the Reference is accent-insensitive, case-insensitive, and
whitespace-tolerant (trimmed, internal whitespace collapsed). "Budapest" and its
districts (e.g., "Budapest XI. kerület", "1094 Budapest") resolve to the Budapest
reference point.
**Consequences (testable):**
- `"Kraków"`, `"KRAKOW"`, and `"  krakow "` all resolve to the same coordinates.
- `"Budapest"` and a district/postal form both resolve to `lat 47.4979, lon 19.0402`.

#### FR-4: Unknown city is non-fatal
If a `telepules` is not in the Reference, the customer is stored with `lat/lon = null`;
this is logged and does not stop the load.
**Consequences (testable):**
- A customer with an unmatched city is persisted with `lat = null` and `lon = null`.
- The loader completes without throwing; a warning is logged for the unmatched city.

### 4.2 Query API

**Description:** Two read endpoints expose the seeded data. Distance and ordering are
computed from stored coordinates using the Budapest reference point. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Customer count
A client can retrieve the number of customers.
**Consequences (testable):**
- `GET /customers/count` returns `{ "count": <integer> }` equal to the actual row
  count (15 for the given seed).

#### FR-6: Customers by distance
A client can retrieve all customers ordered by ascending distance from Budapest.
**Consequences (testable):**
- `GET /customers/by-distance` returns an array; each element includes `distanceKm`
  rounded to 1 decimal.
- Budapest customers appear first with `distanceKm = 0`.
- Customers with unknown coordinates appear last with `distanceKm = null`.
- Ties (equal distance) are ordered by `name` ascending.

#### FR-7: Health check
A client can verify the service is up.
**Consequences (testable):**
- `GET /health` returns a success payload (e.g., `{ "status": "ok" }`).

**Feature-specific NFRs:**
- `distanceKm` is computed by a **unit-tested haversine** function.

## 5. Non-Goals (Explicit)

- No write/update/delete endpoints; the service is read-only.
- No external geocoding service and no runtime LLM calls — ever.
- No authentication, rate limiting, pagination, or UI.
- No dynamic customer import beyond the bundled seed.

## 6. MVP Scope

### 6.1 In Scope
- Idempotent geocoded seed from `seed-customers.json`.
- Offline `telepules → {lat,lon}` Reference for the seed cities.
- `GET /customers/count`, `GET /customers/by-distance`, `GET /health`.
- Unit tests for the distance logic; small, focused commits; README with run steps.
- Postgres MCP wired for schema/data inspection during development.

### 6.2 Out of Scope for MVP
- Everything under §5 Non-Goals.
- Persisting derived distance in the DB (distance is computed at query time) — kept
  out to keep the store minimal. `[NOTE FOR PM]` revisit only if query performance
  ever mattered (it does not at 15 rows).

## 7. Success Metrics

**Primary**
- **SM-1**: Correctness — `count` = 15 and `by-distance` ordering matches the rules
  in FR-6 for the given seed. Validates FR-5, FR-6.
- **SM-2**: Determinism — the full test suite (incl. haversine unit tests: ~214 km
  Budapest–Vienna, 0 km, null handling) passes offline with no network. Validates
  FR-2, FR-6 NFR.

**Secondary**
- **SM-3**: Idempotency — two seed runs keep the row count at 15. Validates FR-1.

**Counter-metrics (do not optimize)**
- **SM-C1**: Do not add features/abstractions beyond the seed-scoped requirements
  (YAGNI). Counterbalances the urge to over-engineer SM-1/SM-2.

## 8. Open Questions
1. Is the Postgres MCP consumed by a Claude app (as on the Superpowers arm) or by
   Cursor? *(Working assumption: Claude app.)*

## 9. Assumptions Index
- [ASSUMPTION] §6.1 — MCP consumer is a Claude app (project-scoped `.mcp.json`).
- [ASSUMPTION] §3 — `country_code` is stored though optional and not required by the
  homework.

---

## API Contracts / Public Surface *(Developer-product cluster)*

- `GET /health` → `200 { "status": "ok" }`
- `GET /customers/count` → `200 { "count": <int> }`
- `GET /customers/by-distance` → `200 [ { "id", "name", "telepules", "distanceKm", ... } ]`,
  ascending by `distanceKm`, Budapest first (`0`), unknown last (`null`), ties by `name`.
- Errors → `500 { "error": <string> }` on unexpected failure. No auth, no versioning
  (single internal consumer).

## Cross-Cutting NFRs

- **Offline determinism:** no external geocoding API and no runtime LLM calls; all
  distance/geocoding logic is local and reproducible.
- **Testability:** distance computation is a pure, unit-tested function.
- **Process visibility:** small, focused commits so the development process is
  traceable (mirrors the Superpowers arm and the harness-comparison goal).
- **Docs:** README covers Postgres start, migration, seed, server run, and tests.
