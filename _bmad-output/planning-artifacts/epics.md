---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd/prd.md
  - _bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md
---

# Customers Distance Service - Epic Breakdown

## Overview

This document decomposes the PRD requirements and Architecture spine into
implementable stories for the Developer agent. Scope is small: one epic delivering
the offline seed, geocoding, and read API. Stories are ordered so each depends only
on earlier stories (never a later one) and is completable in a single dev session
following TDD.

## Requirements Inventory

### Functional Requirements

- **FR-1** Idempotent seed load — loader ingests all customers; re-running keeps 15 rows.
- **FR-2** Offline geocoding from a bundled reference — no network/LLM.
- **FR-3** Robust city matching — accent/case-insensitive, trimmed, Budapest districts.
- **FR-4** Unknown city is non-fatal — `lat/lon = null`, logged, no crash.
- **FR-5** Customer count — `GET /customers/count` → `{ "count": <int> }`.
- **FR-6** Customers by distance — ascending from Budapest; Budapest first (0); unknown last (null); ties by name; `distanceKm` 1 decimal.
- **FR-7** Health check — `GET /health`.

### NonFunctional Requirements

- **NFR-1** Offline determinism — no external geocoding API, no runtime LLM calls.
- **NFR-2** Distance computed by a pure, unit-tested haversine function.
- **NFR-3** Process visibility — small, focused commits.
- **NFR-4** README documents Postgres start, migration, seed, server, tests.

### Additional Requirements

- Data model minimum: `customers(id, name, telepules, lat nullable, lon nullable)`;
  `budget`, `note`, `country_code` optional. `UNIQUE(name, telepules)` for idempotency.
- Postgres MCP wired for a Claude app (project-scoped `.mcp.json`).

### UX Design Requirements

None (headless API, no UI).

### FR Coverage Map

| Requirement | Covered by |
| --- | --- |
| FR-1 | Story 1.4 |
| FR-2 | Story 1.2, Story 1.4 |
| FR-3 | Story 1.2 |
| FR-4 | Story 1.2, Story 1.3, Story 1.4 |
| FR-5 | Story 1.5 |
| FR-6 | Story 1.1, Story 1.3, Story 1.5 |
| FR-7 | Story 1.5 |
| NFR-1 | Story 1.2, Story 1.4 |
| NFR-2 | Story 1.1 |
| NFR-3 | all stories |
| NFR-4 | Story 1.6 |

## Epic List

- **Epic 1: Offline Customers Distance Service** — deliver the full offline pipeline:
  compute distances, geocode cities, order customers, persist idempotently, and expose
  the read API, with tests and docs.

## Epic 1: Offline Customers Distance Service

Deliver an offline REST service that seeds 15 geocoded customers idempotently and
serves a count and a Budapest-distance-sorted list, built bottom-up (pure domain →
persistence → HTTP) so each story is independently testable.

### Story 1.1: Compute distance from Budapest

As a service developer,
I want a pure, unit-tested distance function from Budapest,
So that customer distances are correct and reproducible offline.

**Acceptance Criteria:**

**Given** the project has a TypeScript + Vitest toolchain (scaffolded in this story if absent)
**When** I run the test suite
**Then** `npm test` executes and the distance tests pass
**And** a `haversineKm(a,b)` and `distanceFromBudapestKm(coord)` exist with `BUDAPEST = {lat:47.4979, lon:19.0402}` and a `roundToOneDecimal` helper

**Given** two known points
**When** I compute Budapest→Vienna
**Then** the result is ≈ 214 km (between 210 and 218)
**And** Budapest→Budapest is exactly 0

**Given** a missing coordinate (`null`/partial/undefined)
**When** I call `distanceFromBudapestKm`
**Then** it returns `null` without throwing

### Story 1.2: Resolve customer cities to coordinates offline

As a service developer,
I want an offline `telepules → {lat,lon}` reference with robust matching,
So that every seed city is geocoded without any external call.

**Acceptance Criteria:**

**Given** a bundled reference covering the seed cities
**When** I look up a city with different accents/case/whitespace (e.g. "Kraków", "KRAKOW", " krakow ")
**Then** they all resolve to the same coordinates (FR-3)

**Given** the input "Budapest", "Budapest XI. kerület", or "1094 Budapest"
**When** I look it up
**Then** it resolves to `lat 47.4979, lon 19.0402`

**Given** a city not in the reference (or empty/null)
**When** I look it up
**Then** it returns `null` (FR-4) — no throw, no network call (FR-2, NFR-1)

### Story 1.3: Order customers by distance

As an API consumer,
I want customers mapped to DTOs and ordered by distance,
So that the by-distance response follows the required ordering rules.

**Acceptance Criteria:**

**Given** a list of customer rows (some in Budapest, some elsewhere, some without coordinates)
**When** I build the by-distance list
**Then** Budapest customers come first with `distanceKm = 0`
**And** known distances are ascending, `distanceKm` rounded to 1 decimal (FR-6)

**Given** customers with unknown coordinates
**When** I build the list
**Then** they appear last with `distanceKm = null` (FR-4, FR-6)

**Given** two customers with equal distance
**When** I build the list
**Then** they are ordered by `name` ascending (FR-6)

### Story 1.4: Persist and idempotently seed customers

As a service operator,
I want the customers loaded into Postgres idempotently with geocoded coordinates,
So that the data is queryable and re-running the loader never duplicates rows.

**Acceptance Criteria:**

**Given** a Postgres instance (Docker Compose) and a migration creating `customers` with `UNIQUE(name, telepules)`
**When** I run the migration then the seed
**Then** the table contains exactly 15 customers, each geocoded via Story 1.2's reference (FR-1, FR-2)

**Given** the seed has already run once
**When** I run the seed again
**Then** the row count remains 15 (idempotent upsert, FR-1)

**Given** a customer whose city is unknown
**When** the seed runs
**Then** it is stored with `lat/lon = null` and a warning is logged; the run does not crash (FR-4)

### Story 1.5: Expose count and by-distance endpoints

As an API consumer,
I want HTTP endpoints for the count and the by-distance list,
So that I can query the seeded data over REST.

**Acceptance Criteria:**

**Given** the seeded database
**When** I call `GET /customers/count`
**Then** I get `{ "count": 15 }` matching the row count (FR-5)

**Given** the seeded database
**When** I call `GET /customers/by-distance`
**Then** I get a JSON array ordered per Story 1.3 (Budapest first at 0, unknown last as null, ties by name), each element with `distanceKm` to 1 decimal (FR-6)

**Given** the running service
**When** I call `GET /health`
**Then** I get a success payload (FR-7)
**And** unexpected errors return HTTP 500 `{ "error": ... }`

### Story 1.6: Document run steps and wire Postgres MCP

As a reviewer,
I want a README and a Postgres MCP configuration,
So that I can run everything and inspect the schema/data during development.

**Acceptance Criteria:**

**Given** the finished service
**When** I read the README
**Then** it documents Postgres start, migration, seed, server run, and tests (NFR-4)

**Given** a Claude app
**When** it reads the project-scoped `.mcp.json`
**Then** a Postgres MCP server is configured against the Compose database (offline, local)

**Given** the whole suite
**When** I run `npm test`
**Then** all tests pass (unit tests for distance, reference, ordering)
