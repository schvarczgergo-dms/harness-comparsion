---
title: "Product Brief: Customers Distance Service (BMAD harness)"
status: draft
created: 2026-07-13
updated: 2026-07-13
author: Mary (Business Analyst)
communication_language: English
---

# Product Brief: Customers Distance Service

## Executive Summary

A small, self-contained REST service over PostgreSQL that ingests a fixed set of
15 customers from a bundled `seed-customers.json`, geocodes each customer's city
using a **local, offline** `city -> lat/lon` reference (no external geocoding API,
no LLM at runtime), and exposes two read endpoints: a customer count and a list
of customers sorted by great-circle distance from Budapest.

This is the **BMAD arm of a harness comparison**: the identical scope was already
built on the `harness/superpowers` branch using the Superpowers workflow. Here we
rebuild it using the BMAD Method (PRD -> Architecture -> Epics/Stories -> Sprint ->
Story-cycle TDD) so the two development harnesses can be compared on the same task.

## The Problem

Given a static dataset of customers with only a city name, we need reproducible,
**offline** answers to: "how many customers do we have?" and "which customers are
closest to Budapest?" — without depending on any network geocoding service or LLM
at runtime, and without duplicating rows when the loader is re-run.

## The Solution

- A Postgres-backed loader that seeds the 15 customers **idempotently**.
- An **offline geocoder**: a repo-bundled reference maps each seed city to known
  coordinates; matching is accent-/case-insensitive and whitespace-tolerant, and
  "Budapest" (and its districts) resolves to the capital. Unknown cities store
  `lat/lon = null` (logged, non-fatal).
- Two REST endpoints:
  - `GET /customers/count` -> `{ "count": <int> }`
  - `GET /customers/by-distance` -> customers ascending by distance from Budapest,
    each with `distanceKm` (1 decimal); Budapest first (0 km), unknown-coordinate
    customers last (`distanceKm: null`), ties broken by `name`.

## What Makes This Different

Not a market differentiator — this is a methodology benchmark. The distinguishing
constraint is **strict offline determinism**: distance is computed with a
unit-tested haversine implementation, and geocoding is a bundled lookup, so results
are fully reproducible in CI without secrets or network access.

## Who This Serves

- **Primary:** the course reviewer comparing the BMAD vs Superpowers harness on an
  identical backend task.
- **Secondary:** a developer who wants a minimal, offline, testable reference for a
  Postgres-backed distance API.

## Success Criteria

- `GET /customers/count` returns `15` for the given seed (matches actual row count).
- `GET /customers/by-distance` returns the correct ordering (Budapest 0 km first,
  null-coordinate customers last, ties by name, `distanceKm` to 1 decimal).
- Seed is idempotent: running it twice keeps the row count at 15.
- Haversine unit tests pass: a known distance (Budapest–Vienna ≈ 214 km), the 0 km
  self-distance, and null-coordinate handling.
- Runs fully offline (no external geocoding/LLM calls at runtime).
- README documents Postgres start, migration, seed, server, and tests.

## Scope

**In (first and only version):**
- Idempotent geocoded seed from `seed-customers.json`.
- Local city->coordinate reference for the seed cities.
- The two GET endpoints above and a health check.
- Unit tests for the distance logic; small, focused commits; README.
- Postgres MCP wired so the schema and data are inspectable during development
  [ASSUMPTION] consumed by a Claude app (mirrors the Superpowers branch decision).

**Out:**
- Any write/update endpoints, authentication, pagination, external geocoding,
  runtime LLM calls, UI.

## Vision

The lasting artifact is the **comparison**: two functionally identical backends,
each produced by a different agentic development methodology, so the process
differences (planning depth, role separation, artifact trail, TDD discipline) are
visible side by side.

---

### Assumptions & open items (Fast path)

- [ASSUMPTION] Tech stack mirrors the Superpowers arm for a fair comparison:
  Node.js + TypeScript, Express, node-postgres, Vitest, Docker Compose (Postgres 16).
  *(To be ratified by the Architect workflow — BMAD favors deciding this in
  Architecture, not the brief.)*
- [ASSUMPTION] Data model minimum: `customers(id, name, telepules, lat, lon)` with
  `budget`/`note` optional and stored; `country_code` optional.
- [ASSUMPTION] Reference point Budapest = `{ lat: 47.4979, lon: 19.0402 }`.
- [ASSUMPTION] MCP consumer is a Claude app (project-scoped `.mcp.json`).
