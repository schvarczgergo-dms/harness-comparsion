---
baseline_commit: 83138ac
---
# Story 1.6: Document run steps and wire Postgres MCP

Status: done

## Story

As a reviewer,
I want a README and a Postgres MCP configuration,
so that I can run everything and inspect the schema/data during development.

## Acceptance Criteria

1. README documents Postgres start, migration, seed, server run, and tests (NFR-4).
2. A project-scoped `.mcp.json` configures a Postgres MCP server against the Compose DB (offline/local) for a Claude app.
3. `npm test` runs the full suite green (distance, reference, ordering, HTTP).

## Tasks / Subtasks

- [x] Task 1: README.md — quickstart (db:up, migrate, seed, start, test), endpoints, BMAD artifact trail
- [x] Task 2: .mcp.json — @modelcontextprotocol/server-postgres against postgres://app:app@localhost:5433/customers
- [x] Task 3: Full-suite verification

## Dev Notes

- MCP consumer is a Claude app (Open Question 1 assumption); repo-root `.mcp.json`.
- Deferred item from architecture spine → realized here.
- [Source: _bmad-output/planning-artifacts/prd/prd.md#Cross-Cutting-NFRs]

### References

- FR-7 docs, NFR-4.

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — Opus 4.8 (Cursor)

### Debug Log References

- Final full-suite: 23/23 tests pass across 4 files; `npx tsc --noEmit` clean.

### Completion Notes List

- README documents db:up → migrate → seed → start → test, endpoints, and the BMAD
  artifact trail. `.mcp.json` wires `@modelcontextprotocol/server-postgres` for a
  Claude app against the Compose DB (offline/local).

### File List

- README.md (modified)
- .mcp.json (new)

### Change Log

- 2026-07-13: README + Postgres MCP config; final verification green. Status → review → done.

## Senior Developer Review (AI)

- **Reviewer:** Amelia (independent pass) — **Outcome: Approve**
- **Date:** 2026-07-13
- AC1-3 satisfied. Docs match the actual scripts/ports; MCP config matches Compose creds.
  Full suite green. Epic 1 complete. No action items.
