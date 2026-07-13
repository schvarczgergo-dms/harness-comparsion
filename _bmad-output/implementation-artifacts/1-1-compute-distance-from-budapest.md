---
baseline_commit: 5a4d8c0
---
# Story 1.1: Compute distance from Budapest

Status: done

## Story

As a service developer,
I want a pure, unit-tested distance function from Budapest,
so that customer distances are correct and reproducible offline.

## Acceptance Criteria

1. Project has a TypeScript + Vitest toolchain; `npm test` runs the suite (scaffolded here if absent).
2. `haversineKm(a, b)`, `distanceFromBudapestKm(coord)`, `BUDAPEST = {lat:47.4979, lon:19.0402}`, and `roundToOneDecimal(n)` exist in `src/geo/distance.ts`.
3. Budapest→Vienna ≈ 214 km (210..218); Budapest→Budapest = 0.
4. A missing/partial/null coordinate → `distanceFromBudapestKm` returns `null` without throwing.

## Tasks / Subtasks

- [x] Task 1: Scaffold toolchain (AC: 1)
  - [x] package.json (ESM), tsconfig.json, vitest.config.ts
  - [x] Install express, pg, typescript, tsx, vitest, @types/*
- [x] Task 2: RED — failing tests for distance (AC: 3, 4)
  - [x] test/distance.test.ts: Vienna ≈214, self 0, null handling
- [x] Task 3: GREEN — implement src/geo/distance.ts (AC: 2, 3, 4)
- [x] Task 4: REFACTOR + run suite green (AC: 1, 3, 4)

## Dev Notes

- Paradigm: pure-domain core (AD-1, AD-2) — no IO in `src/geo/`.
- Single source for Budapest reference point (AD-7): `BUDAPEST` const.
- Rounding to 1 decimal lives in domain (AD-5).
- [Source: _bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md#Invariants]
- [Source: _bmad-output/planning-artifacts/prd/prd.md#FR-6]

### References

- FR-6, NFR-2; AD-2, AD-7.

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — Opus 4.8 (Cursor)

### Debug Log References

- RED: `npm test` failed (module `src/geo/distance.ts` missing).
- GREEN: `npm test` → 8/8 passing; `npx tsc --noEmit` clean after enabling `allowImportingTsExtensions`.

### Completion Notes List

- Pure, IO-free distance module (AD-1/AD-2). Haversine symmetric; null-safe distance returns null for missing/partial coords (AD-6). Single Budapest const (AD-7). 1-decimal rounding helper (AD-5).

### File List

- package.json (new)
- tsconfig.json (new)
- vitest.config.ts (new)
- src/geo/distance.ts (new)
- test/distance.test.ts (new)

### Change Log

- 2026-07-13: Scaffolded toolchain; implemented and unit-tested distance domain (8 tests). Status → review.
- 2026-07-13: Code review APPROVED. Status → done.

## Senior Developer Review (AI)

- **Reviewer:** Amelia (independent pass) — **Outcome: Approve**
- **Date:** 2026-07-13
- ACs 1-4 satisfied: toolchain runs (`npm test`), all four exported symbols present,
  Vienna 213.x km within band, self-distance 0, null/partial coords → null.
- Architecture adherence: module is pure/IO-free (AD-1/AD-2); single Budapest const
  (AD-7); rounding in domain (AD-5). No `pg`/express/`fs` imports. Good.
- `Math.min(1, sqrt(h))` guards against domain error at antipode — nice defensive touch.
- No action items (High/Med/Low = 0/0/0).
