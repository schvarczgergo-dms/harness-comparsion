---
baseline_commit: 83138ac
---
# Story 1.5: Expose count and by-distance endpoints

Status: done

## Story

As an API consumer,
I want HTTP endpoints for the count and the by-distance list,
so that I can query the seeded data over REST.

## Acceptance Criteria

1. `GET /customers/count` → `{ "count": 15 }` matching the row count (FR-5).
2. `GET /customers/by-distance` → JSON array ordered per Story 1.3, each with `distanceKm` to 1 decimal (FR-6).
3. `GET /health` → success payload (FR-7); unexpected errors → HTTP 500 `{ "error": ... }`.

## Tasks / Subtasks

- [x] Task 1: src/repository.ts — countCustomers, getAllCustomers (Repository interface for DI)
- [x] Task 2: src/app.ts — createApp(repo): /health, /customers/count, /customers/by-distance, error handler
- [x] Task 3: RED — app integration tests with a fake repo (count, ordering, health, 500)
- [x] Task 4: src/server.ts — listen + graceful shutdown (SIGINT/SIGTERM close pool)
- [x] Task 5: Verify — live curl against seeded DB

## Dev Notes

- HTTP adapter depends on domain + repository (AD-1). Ordering done by `buildByDistanceList`.
- Error shape convention: `{ "error": <string> }` via one error handler.
- Repository injected into createApp so routes are testable without a DB.
- [Source: _bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md#Consistency-Conventions]

### References

- FR-5, FR-6, FR-7; AD-1.

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — Opus 4.8 (Cursor)

### Debug Log References

- GREEN: 23/23 tests pass (4 new app tests); tsc clean.
- Live: `/health` → {"status":"ok"}; `/customers/count` → {"count":15};
  `/customers/by-distance` → Budapest 0 first, Vienna 214, ..., Lisbon 2469.4 last.

### Completion Notes List

- Repository interface injected into `createApp` → routes testable without a DB.
- Ordering delegated to domain `buildByDistanceList` (AD-1). Express 5 error handler
  returns `{ error }` with HTTP 500. Graceful shutdown closes the pool on SIGINT/SIGTERM.

### File List

- src/repository.ts (new)
- src/app.ts (new)
- src/server.ts (new)
- test/app.test.ts (new)

### Change Log

- 2026-07-13: Repository + Express app + server with graceful shutdown; integration tests. Verified live. Status → review → done.

## Senior Developer Review (AI)

- **Reviewer:** Amelia (independent pass) — **Outcome: Approve**
- **Date:** 2026-07-13
- AC1-3 satisfied and verified live and via tests (incl. 500 error-shape path).
- DI keeps the HTTP layer thin and testable (AD-1); no distance logic in SQL/routes (AD-2).
- Graceful shutdown present. No action items.
