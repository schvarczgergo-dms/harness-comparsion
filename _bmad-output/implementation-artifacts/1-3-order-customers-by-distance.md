---
baseline_commit: 83138ac
---
# Story 1.3: Order customers by distance

Status: done

## Story

As an API consumer,
I want customers mapped to DTOs and ordered by distance,
so that the by-distance response follows the required ordering rules.

## Acceptance Criteria

1. Budapest customers first with `distanceKm = 0`; known distances ascending, `distanceKm` to 1 decimal (FR-6).
2. Unknown-coordinate customers last with `distanceKm = null` (FR-4, FR-6).
3. Ties (equal distance) ordered by `name` ascending (FR-6).

## Tasks / Subtasks

- [x] Task 1: RED — customers ordering tests (AC: 1,2,3)
- [x] Task 2: GREEN — CustomerRow, CustomerDistanceDto, buildByDistanceList (AC: 1,2,3)
- [x] Task 3: REFACTOR — comparator (nulls last, then distance, then name)

## Dev Notes

- Pure domain (AD-1, AD-2, AD-5, AD-6): mapping + sort only, no IO.
- distanceKm via distance.ts `distanceFromBudapestKm` + `roundToOneDecimal`.
- [Source: _bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md#AD-6]
- [Source: _bmad-output/planning-artifacts/prd/prd.md#FR-6]

### References

- FR-4, FR-6; AD-2, AD-5, AD-6.

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — Opus 4.8 (Cursor)

### Debug Log References

- RED: customers.test.ts failed (module missing). GREEN: 19/19 tests pass; tsc clean.

### Completion Notes List

- Pure map+sort. Comparator: null distances last, else ascending distance, ties by `name` (localeCompare). distanceKm rounded to 1 decimal in domain (AD-5). DTO uses camelCase `countryCode`/`distanceKm` per conventions.

### File List

- src/customers.ts (new)
- test/customers.test.ts (new)

### Change Log

- 2026-07-13: Implemented DTO mapping + distance ordering (TDD, 5 tests). Status → review → done.

## Senior Developer Review (AI)

- **Reviewer:** Amelia (independent pass) — **Outcome: Approve**
- **Date:** 2026-07-13
- All ordering rules (AC 1-3) covered, incl. tie-break among unknown-coordinate rows.
- Pure/IO-free (AD-1/AD-2); rounding in domain (AD-5); nulls-last invariant (AD-6). No action items.
