---
baseline_commit: 83138ac
---
# Story 1.2: Resolve customer cities to coordinates offline

Status: done

## Story

As a service developer,
I want an offline `telepules → {lat,lon}` reference with robust matching,
so that every seed city is geocoded without any external call.

## Acceptance Criteria

1. Accent/case/whitespace-insensitive matching: "Kraków", "KRAKOW", " krakow " resolve to the same coords (FR-3).
2. "Budapest", "Budapest XI. kerület", "1094 Budapest" resolve to `lat 47.4979, lon 19.0402` (FR-3).
3. Unknown/empty/null city → `null`, no throw, no network (FR-2, FR-4, NFR-1).
4. Reference covers all 15 seed cities (0 unknowns for the given seed).

## Tasks / Subtasks

- [x] Task 1: RED — reference tests (AC: 1,2,3,4)
- [x] Task 2: GREEN — normalizeCity (NFD accent-strip, lowercase, trim, collapse) (AC: 1)
- [x] Task 3: GREEN — lookupCoord with Budapest-district rule + Object.hasOwn (AC: 2,3)
- [x] Task 4: Populate CITY_COORDS for all 15 seed cities (AC: 4)

## Dev Notes

- Pure domain (AD-1, AD-3): no IO, no network/LLM.
- Use `Object.hasOwn` (not `in`) so inherited prototype keys ("toString") don't match.
- Budapest reference point comes from `distance.ts` `BUDAPEST` (AD-7) — do not redefine.
- [Source: _bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md#AD-3]
- [Source: _bmad-output/planning-artifacts/prd/prd.md#FR-3]

### References

- FR-2, FR-3, FR-4; AD-3, AD-7.

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — Opus 4.8 (Cursor)

### Debug Log References

- RED: reference.test.ts failed (module missing). GREEN: 14/14 tests pass; tsc clean.

### Completion Notes List

- NFD accent-stripping + lowercase/trim/collapse normalization. Budapest-district rule via token match on "budapest". `Object.hasOwn` guards prototype-key false positives. Reference covers all 15 seed cities; reuses `BUDAPEST` from distance.ts (AD-7).

### File List

- src/geo/reference.ts (new)
- test/reference.test.ts (new)

### Change Log

- 2026-07-13: Implemented offline geocoding reference + normalization (TDD, 6 tests). Status → review → done.

## Senior Developer Review (AI)

- **Reviewer:** Amelia (independent pass) — **Outcome: Approve**
- **Date:** 2026-07-13
- ACs 1-4 satisfied; explicit prototype-key regression test present (guards the classic
  `key in obj` bug via `Object.hasOwn`). Pure/offline (AD-3), no redefinition of the
  Budapest point (AD-7). No action items.
