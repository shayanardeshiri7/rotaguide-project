# CLAUDE.md — RotaGuide

Context for Claude Code working in this repository.

## What this is

RotaGuide is a two-part system from a University of Calgary BMEN 668 capstone (Feb–Apr 2026):

1. **A physical guide** — a flat 3D-printed PLA plate with **12 numbered circular ports** in a 4×3 grid, placed on the skin. Ports are ~10 mm across and spaced **30 mm** apart against a ≥20 mm requirement. Plate is ~8 mm thick.
2. **A tracker PWA** — mirrors the plate's zones, suggests where to inject next, flags repeats, and tracks rotation over time.

The clinical target is **lipohypertrophy**: 38% pooled prevalence in insulin-treated patients, odds ratio ≈8.85 from failing to rotate, +0.55% HbA1c where present.

### Corrections to earlier drafts

Earlier versions of this file and the README described things that the final report does not support. If you find these claims anywhere, they are wrong:

| Wrong | Correct |
|---|---|
| "Rotational dial guide with a detent mechanism, neodymium magnets, spring-loaded ball bearing" | A **flat plate** with circular ports. No dial, no detent, no magnets. The *app* uses a radial dial — that is a UI metaphor and it stays. |
| "~$75 CAD device / budget ≤$100" | Actual spend was **$17** against a $100 ceiling. |
| Team of five listed by name | Credit by **role only**. Do not add individual names to public copy. |
| "All nine specs verified" | **Four of nine** verified. The other five are "cannot determine" and must be listed, not hidden. |

## Non-negotiable constraints

These come from the project's own ethics analysis and FMEA. They are not style preferences.

1. **Not a medical device.** Say so on any public surface. Would likely be Health Canada Class II if commercialised.
2. **No false reassurance.** Ethical Failure #1 is the device creating false confidence. The words *ensures, prevents, guarantees, eliminates, cures, clinically proven* are banned from user-facing copy. There is a test asserting this — see `apps/web/content/project.ts` (`BANNED_CLAIMS`) and the copy tests.
3. **Privacy first.** Never transmit injection data off-device without explicit consent. Sync is opt-in, off by default, behind a consent screen that names the exact fields sent.
4. **Accessibility is a requirement.** Users include older adults with reduced vision, neuropathy, arthritis. ≥44 px targets, WCAG 2.2 AA, keyboard-complete, colour never the only channel.

## Layout

```
apps/app/          Tracker PWA (Vite 6 + React 19 + TS strict)
  src/domain/      PURE rotation logic — the important part
  src/store/       Zustand + persist over IndexedDB
  src/lib/         Zod schemas, v1 migration, CSV, en-CA dates
  src/sync/        Supabase adapter, dynamically imported
apps/web/          Project site (Next 15 App Router, static)
  content/         All public claims, each with a source
packages/ui/       Shared design tokens (both surfaces must match)
packages/config/   ESLint + tsconfig presets
legacy/v1/         Original submission, served live at /v1
supabase/          RLS migrations
```

## Rules when editing

**The domain layer is pure.** `apps/app/src/domain` must not import React, Zustand, or anything under `store/` or `features/`, and must not touch `window`, `document`, `localStorage`, `indexedDB`, or `navigator`. ESLint enforces this. Time is always injected via an explicit `now` parameter — never call `Date.now()` inside a calculation.

**Coverage on the domain is 100%, enforced by threshold.** If you add a branch, add the test. Do not lower the threshold, and do not reach for `/* v8 ignore */` — the v8 provider strips comments before instrumenting, so it does not work anyway. If a branch is genuinely unreachable, restructure until it does not exist.

**Zone indices are 0-based internally and displayed +1.** The user's plate says 1–12. Getting this wrong points someone at the wrong part of their body.

**Persisted state is untrusted.** Everything read from storage goes through Zod (`src/lib/schema.ts`). A corrupt entry is dropped individually; never fail the whole history.

**Never delete the v1 localStorage key.** `migrate.ts` marks migration with a separate flag so a failed import can be retried by hand.

**Design tokens live in `packages/ui/src/tokens.css`.** No hardcoded hex in component logic. The site and the app must look like one product.

**Dates are en-CA.** ISO-like dates, 24-hour clock — unambiguous for a log a clinician might read.

## Commands

```bash
pnpm dev              # both apps
pnpm test             # unit + component
pnpm test:coverage    # enforces the domain threshold
pnpm e2e              # Playwright + axe
pnpm lint typecheck build
```

## Verified numbers

Use these exact figures; they trace to the final report. n = 5, simulated use.

| Metric | Spec | Result |
|---|---|---|
| Logging time | ≤ 15 s | 11.4 s median |
| Placement accuracy | ≤ ±5 mm | 2.6 mm avg, 100% in tolerance |
| Comfort | ≥ 4/5 | 4.0 / 5 |
| Ease of use | — | 4.4 / 5 |
| Rotation clarity | — | 4.8 / 5 |
| App usability | — | 4.4 / 5 |

Unverified: ISO 10993 biocompatibility, ≥500-use durability, alcohol-wipe tolerance, ±10 mm tracking resolution, ≥14 pt readability.

FMEA top risks, RPN before → after: wrong-port injection 252→96; false confidence 240→96; cross-contamination 180→54.

## Style

- Plain language, roughly grade-6 reading level — users include older adults.
- One-handed phone use during an injection routine. Max width 480px.
- Say what is known and what is not. The honesty *is* the credibility here.
