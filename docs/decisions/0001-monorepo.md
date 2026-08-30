# ADR 0001 — One monorepo, restructured in place

**Status:** Accepted
**Date:** 2026-08-30

## Context

v1 was a single 56 KB `index.html` with inline CSS and vanilla JS, one commit, deployed nowhere. v2 needed a marketing site and a rewritten tracker. Those are two deployables with genuinely different stacks — a static content site and a client-side PWA.

The obvious options were a fresh repository, two repositories, or a restructure of the existing one.

## Decision

**One repository — the existing `rotaguide-project` — restructured in place, with pnpm workspaces and Turborepo.**

`apps/web` and `apps/app` are separate deployables sharing `packages/ui` (design tokens) and `packages/config` (lint and TypeScript presets).

v1 is preserved three ways before anything moved: a `v1.0.0` git tag, a frozen `v1` branch, and `legacy/v1/` on the default branch. A prebuild step copies `legacy/v1/` into the site's public folder so the original stays live at `/v1`.

## Consequences

**Good.** The site and the app must look like one product, and sharing a token file is the only way that holds over time — two copies drift. One CI run covers both. The commit history reads as v1 → v2 rather than a polished repo appearing from nowhere, which is a more honest and more interesting record.

Keeping v1 deployed means the case for v2 can be checked rather than asserted: the "what changed" section links the original next to the current build.

**Costs.** Turborepo and pnpm workspaces are machinery a two-app project does not strictly need. Accepted because the shared-token problem is real and the alternative is manual synchronisation. Contributors need pnpm specifically; npm and yarn will not resolve `workspace:*`.

**Rejected: a new repository.** It would have discarded the existing history and the URL. The upgrade narrative is worth more than a clean slate.

**Rejected: two repositories.** Token drift between them was the deciding factor, followed by having to open two pull requests for one visual change.
