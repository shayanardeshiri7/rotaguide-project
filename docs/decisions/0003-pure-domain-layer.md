# ADR 0003 — A pure domain layer, enforced by lint

**Status:** Accepted
**Date:** 2026-08-30

## Context

In v1 the rotation logic lived inside DOM-rendering functions. `renderDial()` computed the recommendation as a side effect of drawing sectors; adherence was calculated inside the history renderer. The logic was not wrong, but it was unreachable from a test without a browser, and it could not be reasoned about independently of the UI.

The final report named the algorithms themselves as a limitation — least-recently-used ignores where zones physically are. Fixing that meant changing logic that had no tests, which is the position you do not want to be in when the output points at somewhere on a person's body.

## Decision

**All rotation logic moves to `apps/app/src/domain`, which is pure: no React, no DOM, no I/O, and no implicit clock reads.**

Enforced rather than encouraged:

- ESLint forbids importing `react`, `react-dom`, `zustand`, `@/store/*`, or `@/features/*` from anything under `src/domain`, and forbids the `window`, `document`, `localStorage`, `indexedDB`, and `navigator` globals.
- Time is an explicit parameter. Every function taking "now" accepts it as an argument; the default is applied only at the public entry point.
- Coverage thresholds require 100% statements, branches, functions, and lines on `src/domain`, enforced in CI.

## Consequences

**Good.** The algorithms became testable without a DOM, which made it safe to change them — the upgrade from index-based LRU to distance-weighted scoring was a rewrite of the core recommendation with a property test asserting it never returns the most recently used zone. Property-based tests (fast-check) are only practical because the functions are pure and deterministic.

Derived values are computed at render time rather than stored, so an algorithm change never requires a data migration and displayed numbers cannot drift from the history that produced them.

**Costs.** Threading `now` through call sites is more verbose than calling `Date.now()` inline. Accepted: it is the reason the tests are deterministic rather than flaky around midnight.

The 100% branch threshold conflicts with TypeScript's `noUncheckedIndexedAccess`, which forces guards on provably in-range indices. `/* v8 ignore */` does not solve this — the v8 coverage provider instruments post-transform output, and esbuild has already stripped the comments. The resolution is to restructure until the unreachable branch does not exist (iterate instead of index; accumulate into a `Map` instead of a pre-sized array). This costs a little effort per occurrence and produces better code each time, so the threshold stays at 100.
