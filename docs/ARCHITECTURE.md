# RotaGuide v2 — System Design, Architecture & Build Pipeline

**Status:** Planning doc. Nothing has been built yet.
**Author:** Shayan Ardeshiri · drafted with Claude, 2026-08-30
**Supersedes:** `rotaguide-project/CLAUDE.md` (see §1.3 — the old file contradicts the final report)
**Source of truth for content:** BMEN 668 Final Project Report (37 pp), Project Proposal Group 3, Team Assignments 2–6

---

## 0. What we're building and why

The BMEN 668 capstone shipped as a single 56 KB `index.html` with inline CSS and vanilla JS, deployed nowhere, one commit on GitHub, no description, no tests. The engineering work behind it is genuinely good — a real clinical problem, a real prior-art review, an FMEA, an ethics analysis, and n=5 user testing with numbers that hit spec. None of that is visible to anyone who lands on the GitHub profile.

**v2 goal:** turn RotaGuide into the project that carries the GitHub profile — a real monorepo, a real deployment, a marketing-grade landing page, and a tracker app rewritten in React + TypeScript with tests and CI.

Two audiences, and every decision below serves one of them:

| Audience                    | Lands on     | Needs to conclude within 15 seconds                              |
| --------------------------- | ------------ | ---------------------------------------------------------------- |
| Recruiter / hiring manager  | Landing page | "This person ships polished product, not class projects."        |
| Engineer reviewing the code | GitHub repo  | "Clean architecture, typed, tested, CI green, sensible commits." |

---

## 1. Ground truth — what the project actually is

### 1.1 The clinical problem (all figures verified against the final report)

Repeated insulin injection into the same subcutaneous area causes **lipohypertrophy (LH)** — thickened tissue that absorbs insulin slowly and unpredictably.

| Fact                                             | Value                                     | Source                |
| ------------------------------------------------ | ----------------------------------------- | --------------------- |
| Pooled LH prevalence in insulin-treated patients | **38%** (26 studies, 12,493 participants) | Deng et al. 2017 [1]  |
| Failure to rotate sites → LH                     | pooled **OR ≈ 8.85**                      | Mader et al. 2025 [6] |
| LH → unexplained hypoglycemia                    | pOR ≈ **6.98**                            | Mader et al. 2024 [4] |
| LH → glycemic variability                        | pOR ≈ **5.24**                            | Mader et al. 2024 [4] |
| LH → worse HbA1c                                 | mean difference **+0.55%**                | Mader et al. 2024 [4] |

> ⚠️ The old README says "7× increased hypoglycemia risk." The report says pOR ≈ 6.98. Use **6.98** or write "≈7× odds," not "7× risk" — odds ratio ≠ risk. This is exactly the kind of overclaim Assignment 5 flags as an ethical failure.

### 1.2 The system — two components

**Physical guide (Fusion 360, 3D printed).** A _rectangular plate_ with 12 circular openings in a staggered grid, **not** a rotating dial.

| Parameter       | Value                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Hole diameter   | ~10 mm (clears 4–8 mm pen needles)                                                                    |
| Hole spacing    | ~30 mm (spec minimum is ≥20 mm — deliberately conservative)                                           |
| Plate thickness | ~8 mm (rigidity vs. portability tradeoff)                                                             |
| V1 footprint    | ~12 cm × 8 cm — 12 zones, for abdomen and thigh                                                       |
| V2 footprint    | ~6 cm × 8 cm — fewer zones, better for arm; adds a **notched reference edge** for tactile orientation |
| Edges           | Rounded / chamfered for comfort during repeated placement                                             |

The V1→V2 iteration is the strongest engineering-narrative beat in the whole project: a measured limitation (footprint too large for curved arm surfaces) drove a deliberate tradeoff (fewer zones per placement) plus an accessibility feature (the notch supports non-visual alignment).

**Digital tracker.** Mirrors the guide's zones. 6 body regions (Abdomen L/R, Thigh L/R, Arm L/R), 6–12 configurable zones, tap-to-log, least-recently-used recommendation, repeat-site warning, history, insights, CSV export, dark mode, PWA, local-only storage.

### 1.3 ⚠️ Contradictions to resolve before writing any public copy

The existing `CLAUDE.md` and `README.md` were written mid-project and no longer match the final report. Fix these first — a recruiter who reads both will notice.

| Claim in old docs                                                                                                         | What the final report says                                                                            | Action                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Rotational dial guide, 12 ports arranged radially, detent mechanism with neodymium magnets + spring-loaded ball bearing" | Rectangular plate, 12 circular openings, no detent, no magnets                                        | **Delete the dial narrative.** The _app_ keeps its radial dial UI (that's a UI metaphor and it's good) — but the physical device is a plate. Say so plainly. |
| Team of 5 (incl. Ben Penny)                                                                                               | Final report lists 4 authors: Qummar Mahmood, Prabjot Sanghera, Shayan Ardeshiri, Ramtin Chelongarian | **Ask the team.** Default: credit all 5 who contributed across the term, note the report's 4 authors. Don't quietly drop a name.                             |
| "Physical dial guide (~$75 CAD)" / budget ≤$100                                                                           | Actual spend: **$17.00** total ($10 alcohol wipes, $0 hosting, $0 Figma, $7 contingency)              | Use **$17 actual against a $100 ceiling**. That's a better story than $75.                                                                                   |
| "No tests — zero coverage"                                                                                                | Still true                                                                                            | This is Phase 4 of the plan below.                                                                                                                           |

### 1.4 Verified test results — the numbers the landing page is built around

n = 5 participants, simulated-use conditions, three evaluations:

| Metric                     | Spec    | Result                                          | Verdict           |
| -------------------------- | ------- | ----------------------------------------------- | ----------------- |
| Logging time per injection | ≤ 15 s  | **11.4 s** median                               | ✅ Meets          |
| Guide placement accuracy   | ≤ ±5 mm | **2.6 mm** avg error, **100%** within tolerance | ✅ Meets          |
| Ease of use                | —       | 4.4 / 5                                         | —                 |
| Comfort                    | ≥ 4 / 5 | 4.0 / 5                                         | ✅ Meets (barely) |
| Rotation clarity           | —       | **4.8 / 5**                                     | —                 |
| App usability              | —       | 4.4 / 5                                         | —                 |

Honest caveats that **must** appear on the page, not be buried: n=5, simulated environment (not on skin), one older participant found the plate too rigid on the abdomen, and **only 4 of the 9 technical specs are actually verified**. The other 5 — ISO 10993 biocompatibility, ≥500-use durability, alcohol-wipe cleaning tolerance, ±10 mm digital tracking resolution, ≥14 pt UI readability — remain **"cannot determine"**, needing bench testing the course had no budget or timeline for.

(Assignment 6, written March 30, marked positioning accuracy and logging time as undetermined too; the April user testing resolved both. Use the April status, not the March table.)

### 1.5 Non-negotiable framing constraints

These come straight out of Assignment 5 and the FMEA. They are not decoration — they're the reason the project is credible.

1. **Not a medical device.** Academic prototype. Would be **Health Canada Class II** if commercialized, requiring a Medical Device Licence and ISO 13485 QMS. Say this on the page.
2. **No false reassurance.** Ethical Failure #1 in Assignment 5 is the device creating false confidence. App copy and marketing copy must never imply the system guarantees safe rotation. Words like "ensures," "prevents LH," "guarantees" are banned.
3. **Privacy-first is a commitment, not a feature.** "Never transmit injection data off-device without explicit user consent" is written into the project's own style guide. This directly constrains the Supabase design in §5.
4. **Accessibility is a requirement, not polish.** Target users include older adults with reduced vision, neuropathy, and arthritis. ≥14 pt legibility, ≥44 px tap targets, WCAG 2.2 AA.

---

## 2. Repo & hosting architecture

**Decision: one monorepo, two Vercel projects — inside the existing `rotaguide-project` repo.**

No new repository, no rename. `github.com/shayanardeshiri7/rotaguide-project` stays exactly where it is; v2 is a restructure _inside_ it, on top of the existing history. The v1 single-file app is preserved three ways (§2.1) so the upgrade reads as an upgrade — v1 → v2 in one commit log is a better portfolio story than a repo that appears out of nowhere fully formed.

```
rotaguide-project/                  ← SAME REPO, restructured in place
├── legacy/
│   └── v1/                         ← the original single-file app, kept browsable
│       ├── index.html              ← moved from public/index.html, unchanged
│       ├── manifest.json
│       ├── sw.js
│       └── README.md               ← "this is v1, here's what changed in v2"
├── apps/
│   ├── web/                        ← Next.js 15 (App Router) — the marketing site
│   │   ├── app/
│   │   │   ├── page.tsx            ← Landing (the long scroll)
│   │   │   ├── case-study/page.tsx ← Page 2 (see §3.3 — CONFIRM SCOPE)
│   │   │   ├── layout.tsx
│   │   │   └── opengraph-image.tsx
│   │   ├── components/
│   │   │   ├── sections/           ← Hero, Problem, Device, AppCarousel, Results, Ethics, Team
│   │   │   ├── device/             ← DevicePlate.tsx (SVG), V1V2Morph.tsx
│   │   │   └── motion/             ← ScrollReveal, StickyScroller, Parallax, CountUp
│   │   ├── content/                ← MDX/TS content modules — copy lives here, not in JSX
│   │   └── public/                 ← renders, moodboard-derived art, OG image
│   │
│   └── app/                        ← Vite + React 19 + TS — the tracker PWA
│       ├── src/
│       │   ├── features/
│       │   │   ├── log/            ← RadialDial, RegionPicker, LogButton, RepeatWarning
│       │   │   ├── history/        ← StatsRow, LogList
│       │   │   ├── insights/       ← Heatmap, DailyChart, AdherenceBar
│       │   │   ├── settings/       ← ZoneCount, Threshold, Theme, Export, Sync
│       │   │   └── onboarding/     ← Stepper
│       │   ├── domain/             ← PURE, framework-free, 100% unit-tested (§4.2)
│       │   │   ├── zones.ts        ← zone geometry, region model
│       │   │   ├── recommend.ts    ← next-zone algorithm
│       │   │   ├── adherence.ts    ← adherence scoring
│       │   │   └── types.ts
│       │   ├── store/              ← Zustand + persist middleware
│       │   ├── sync/               ← Supabase adapter (opt-in, §5)
│       │   ├── lib/                ← csv.ts, date.ts (en-CA), migrate.ts
│       │   └── styles/tokens.css   ← the single source of design tokens
│       ├── public/manifest.webmanifest
│       └── vite.config.ts          ← vite-plugin-pwa
│
├── packages/
│   ├── ui/                         ← shared primitives (Button, Card, Badge) + tokens
│   ├── domain/                     ← OPTIONAL: hoist src/domain here if the landing page
│   │                                 wants to run a live demo of the algorithm
│   └── config/                     ← eslint, tsconfig, tailwind presets
│
├── docs/
│   ├── ARCHITECTURE.md             ← this file
│   ├── engineering/                ← specs table, FMEA, ethics summary, test protocol
│   ├── build-guide.md              ← physical prototype (migrated)
│   └── decisions/                  ← ADRs: 0001-monorepo.md, 0002-local-first.md, …
│
├── .github/workflows/ci.yml
├── turbo.json
├── pnpm-workspace.yaml
├── README.md                       ← rewritten; this is the recruiter's first screen
└── LICENSE                         ← MIT or CC BY-NC — decide (§9, open question)
```

**Why a monorepo:** shared design tokens between site and app (they must look like one product), one CI run, one PR, one commit history telling one story. Turborepo + pnpm workspaces.

**Deployment:**

| Project         | Root dir   | Framework | Domain                             |
| --------------- | ---------- | --------- | ---------------------------------- |
| `rotaguide-web` | `apps/web` | Next.js   | `rotaguide.vercel.app` (or custom) |
| `rotaguide-app` | `apps/app` | Vite      | `app.rotaguide.vercel.app`         |

Both auto-deploy from `main`; every PR gets a preview URL. GitHub Pages is **not** used — a `gh-pages` redirect stub is optional and probably not worth it.

### 2.1 Restructuring in place — and keeping v1 alive

The repo currently has **one commit** and a Firebase config. That single commit is the whole v1 record, so it needs protecting before anything moves.

**v1 is preserved three ways, deliberately:**

1. **Git tag `v1.0.0`** on the current commit — the exact capstone submission, permanently retrievable, and it gives the repo a Releases entry.
2. **Branch `v1`** pushed and left untouched — anyone can `git checkout v1` and see the original tree layout.
3. **`legacy/v1/` in the working tree** — the file stays browsable on the default branch without checking anything out, and it gets served (below) so the _live_ v1 stays clickable.

```bash
# in .../CLASSES/668/rotaguide-project, on main, working tree clean
git fetch origin
git tag -a v1.0.0 -m "BMEN 668 capstone submission — single-file vanilla JS tracker"
git push origin v1.0.0
git branch v1 && git push -u origin v1        # frozen snapshot branch

git checkout -b v2-rewrite
mkdir -p legacy/v1
git mv public/index.html public/manifest.json public/sw.js legacy/v1/
git rm firebase.json                           # Vercel replaces it
# scaffold the monorepo around what's left; move docs/*.md into docs/
git commit -m "chore: restructure as monorepo, preserve v1 under legacy/"
```

**Serve v1 alongside v2.** Copy `legacy/v1/` into `apps/web/public/v1/` at build time (a one-line prebuild script, so it never drifts). The original app then stays live at `rotaguide.vercel.app/v1/`, and the case-study page can offer a genuine **"try the original"** link next to the v2 app. Side-by-side v1/v2 is a much stronger demonstration than a screenshot of an old UI — it shows the delta rather than asserting it.

**On GitHub — additive only, no rename:** add a description, add topics (`react`, `typescript`, `healthcare`, `pwa`, `biomedical-engineering`, `capstone`), set the website URL, and write a short release note on the `v1.0.0` tag. The repo name, URL, and stars/history all stay put.

> Housekeeping: there's a duplicate checkout at `Assignment/Team/rotaguide-project/` and a stray literal folder named `{docs,public,.github}` (a shell brace-expansion that never expanded). Both are local-only clutter — delete them, they're not in the repo.

---

## 3. The website (`apps/web`)

### 3.1 Stack

| Layer     | Choice                                                                                           | Note                                                                |
| --------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Framework | Next.js 15, App Router, SSG                                                                      | SEO + OG cards matter for something you'll link in applications     |
| Language  | TypeScript, strict                                                                               |                                                                     |
| Styling   | Tailwind v4 + CSS custom properties                                                              | Tokens shared with the app via `packages/ui`                        |
| Motion    | Motion (Framer Motion) for reveals/layout; GSAP ScrollTrigger only if a pinned sequence needs it | Don't load both unless the device section actually requires pinning |
| Type      | Variable fonts, `next/font` self-hosted                                                          | No render-blocking CDN; also fixes the offline story                |
| Analytics | Vercel Analytics (cookieless)                                                                    | Consistent with the privacy stance                                  |

### 3.2 Landing page — scroll narrative

One long page, seven acts. The scroll _is_ the argument: problem → why existing solutions fail → our device → our app → did it work → what we'd do differently.

| #   | Section               | Content                                                                                                                                                                                                                                                                | Motion treatment                                                                                                                                        |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Hero**              | Product name, one-line positioning, the device rendered large. One primary CTA → live app, one secondary → GitHub.                                                                                                                                                     | Slow parallax on the device; text staggers up. Keep it under 1.2 s to settle.                                                                           |
| 2   | **The 38%**           | The LH problem. Three numbers: 38% prevalence, 8.85 OR, +0.55% HbA1c. Healthy vs. LH tissue illustration.                                                                                                                                                              | Numbers count up on enter (`prefers-reduced-motion` → static).                                                                                          |
| 3   | **Why nothing works** | Education depends on memory. Apps depend on logging. Smart pens are brand-locked and expensive. Paper charts are static. Sourced from the prior-art table (7 solutions reviewed, 5 patents).                                                                           | Horizontal card rail or staggered fade.                                                                                                                 |
| 4   | **The device**        | V1 → V2. The Fusion 360 render, exploded dimension callouts (30 mm spacing, 10 mm ports, 8 mm thick), the notched edge, the footprint change.                                                                                                                          | **Sticky-pinned section.** As you scroll, V1 morphs to V2 with animated dimension lines. This is the section that earns the "niche modern" brief.       |
| 5   | **The app** ★         | **The carousel you asked for.** 5 slides, each a device-framed screenshot/live embed + one-sentence function: (1) Zone dial & one-tap logging, (2) Smart next-zone recommendation, (3) Repeat-site warning, (4) Insights & heatmap, (5) Offline PWA + local-only data. | Horizontal scroll-snap on desktop, swipe on mobile. Auto-advance **off** by default (accessibility). Each slide's phone frame tilts slightly on scroll. |
| 6   | **Did it work**       | The results table from §1.4, with the honest caveats given equal visual weight — not a footnote. n=5, simulated, 4 of 9 specs verified.                                                                                                                                | Progress bars fill to target; the 5 "cannot determine" specs rendered in a muted state, listed, not hidden.                                             |
| 7   | **Rigour & ethics**   | FMEA top risks with RPN before/after mitigation (252→96, 240→96, 180→54). Health Canada Class II framing. The "not a medical device" statement. Team credits, course, instructor.                                                                                      | Simple, calm, dense. Restraint here reads as confidence.                                                                                                |

**Footer:** GitHub, live app, the final report PDF, LinkedIn.

### 3.3 ❓ Page 2 — needs your decision

You said "2 pages are enough" but only described the landing page. Three candidates:

- **A. Case study / engineering deep-dive** _(recommended)_ — the long-form version: full spec table with pass/fail status, complete FMEA, ethics analysis, prior-art comparison, test protocol and raw results, V1→V2 iteration log. This is what an engineering manager reads after the landing page sells them. It's also 90% written already — it's the final report, restructured for the web.
- **B. Process / design log** — the moodboard, the Figma work, UI iterations, the design decisions. Better if you're aiming at design-adjacent roles.
- **C. About / contact** — thin. Your portfolio site should do this, not the project site.

Default assumption if you don't say otherwise: **A**.

### 3.4 Visual direction — blocked on your moodboard

You mentioned moodboard images but nothing is attached yet. **Drop them into the chat and I'll derive the palette, type scale, and motion vocabulary from them.** Until then, the working direction inherits the app's existing tokens so the two properties feel like one product:

```
--bg      #F7F5F2   warm off-white
--accent  #2D7A5F   clinical green
--warn    #C75B39   burnt orange
type      DM Sans (UI) + JetBrains Mono (all numerals)
```

Direction to aim at: warm-neutral canvas, generous whitespace, monospace numerals doing the heavy lifting, one accent colour used sparingly, motion that's slow and deliberate rather than bouncy. Medical-adjacent restraint — closer to a Linear/Vercel changelog than a SaaS splash.

**Assets we do have:** the Fusion 360 V1 render (extracted from the proposal PDF, 678×607 — usable but low-res), the Gantt chart, two NotebookLM/Napkin diagrams from the deck.
**Assets we don't have:** photos of the printed prototype, CAD source files, app screenshots at retina resolution.
**Plan:** rebuild the device as **inline SVG/CSS from the report's dimensions** — sharper at any size, animatable for the V1→V2 morph, and no dependency on chasing Ramtin for files. App screenshots get captured from the real v2 app via Playwright once it's running (§4.4), so they're always current.

---

## 4. The tracker app (`apps/app`)

### 4.1 Stack

| Layer            | Choice                                             | Why                                                                                                             |
| ---------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Build            | Vite 6                                             | Fast, lean, no server needed — it's a client-side PWA                                                           |
| UI               | React 19 + TypeScript strict                       |                                                                                                                 |
| State            | Zustand + `persist` middleware                     | Small, typed, no boilerplate; persist gives us localStorage → IndexedDB migration for free                      |
| Storage          | IndexedDB via `idb-keyval` (localStorage fallback) | localStorage caps out and is synchronous; IndexedDB survives better                                             |
| Routing          | React Router (4 tabs) or plain tab state           | Tabs don't really need a router — decide during build                                                           |
| Charts           | Hand-rolled SVG                                    | Recharts is 100 KB for four simple charts; the existing hand-drawn SVG is better and already matches the design |
| PWA              | `vite-plugin-pwa` (Workbox)                        | Replaces the hand-written `sw.js`                                                                               |
| Forms/validation | Zod at the storage boundary                        | Guards against corrupt persisted state                                                                          |

### 4.2 The domain layer — the part that makes this repo interesting

Everything below is **pure functions, no React, no DOM, 100% unit-tested.** This is the single highest-leverage change: it turns "a UI with logic sprinkled in" into "a tested domain model with a UI on top," which is exactly the distinction a reviewer looks for.

```ts
// domain/types.ts
export type RegionId = 'abdomen-L' | 'abdomen-R' | 'thigh-L' | 'thigh-R' | 'arm-L' | 'arm-R';

export interface LogEntry {
  readonly id: string;
  readonly region: RegionId;
  readonly zone: number; // 0-indexed; displayed +1
  readonly timestamp: string; // ISO 8601
}

export interface ZonePoint {
  readonly x: number;
  readonly y: number;
} // mm, region-local
```

**Three algorithms to build and test:**

1. `recommendNextZone(logs, region, zoneCount)` — currently least-recently-used. **Upgrade:** score candidates by `spatialDistance × recencyWeight`, so the recommendation respects the ≥20 mm rule rather than just "not the last one." The report names the naïve version as a known limitation; fixing it in v2 and saying so is a strong beat for the case-study page.
2. `calculateAdherence(logs)` — currently "different from previous." **Upgrade:** percentage of consecutive pairs separated by ≥20 mm _in the zone geometry model_, not just "different index."
3. `detectRepeatRisk(logs, zone, region, threshold)` — returns a typed result (`{ level: 'none'|'caution'|'warning', lastUsed, daysSince }`) so the UI renders states instead of booleans.

Property-based tests (fast-check) on all three: adherence always ∈ [0,1]; a recommendation is never the most-recently-used zone; the algorithm is deterministic for a given log set.

### 4.3 Migration path for existing users

Anyone who used the v1 app has data under localStorage key `rotaguide_v2`. `lib/migrate.ts` reads it, validates with Zod, writes to the new IndexedDB store, and marks it migrated. **This must be tested** — silently losing a user's injection history is the worst possible bug in this app. Keep the old key for one release, don't delete it.

### 4.4 Screenshot pipeline

A Playwright script seeds deterministic demo data, drives the app to each of the 5 carousel states, and writes retina PNGs into `apps/web/public/screens/`. Runs in CI on `main`, so the marketing site can never show a stale UI. This is the sort of detail that makes a portfolio repo feel professional.

---

## 5. Optional cloud sync (Supabase) — the constrained design

You picked this, and it's the right call for showing full-stack range. But it collides head-on with the project's own privacy commitment ("never transmit injection data off-device without explicit user consent"), so the design has to earn it. **Health data leaving the device by default would make the site's own ethics section a lie.**

**Rules:**

1. **Local-first, always.** The app is fully functional with sync off. Sync is a toggle in Settings, **default off**, behind an explicit consent screen that says in plain language what leaves the device.
2. **Auth:** Supabase Auth, magic link only. No password storage, no OAuth provider hoarding profile data.
3. **Row Level Security on every table**, no exceptions. `user_id = auth.uid()`. Write the policies into `supabase/migrations/` so they're reviewable in the repo — RLS policies in version control is itself a portfolio signal.
4. **Minimal schema.** Only what rotation logic needs:
   ```sql
   create table injections (
     id          uuid primary key,
     user_id     uuid not null references auth.users on delete cascade,
     region      text not null,
     zone        smallint not null,
     occurred_at timestamptz not null,
     created_at  timestamptz default now()
   );
   ```
   No names, no DOB, no glucose values, no dose amounts. Nothing that isn't strictly required.
5. **Conflict resolution:** last-write-wins per entry `id`; entries are immutable once written, so conflicts are rare by construction.
6. **Export and delete.** One button exports everything; one button deletes the account and cascades. Non-negotiable.
7. **Document the tradeoff** in `docs/decisions/0002-local-first.md`. The ADR is part of the deliverable — it shows you reasoned about it rather than bolting on a backend because backends look impressive.

---

## 6. Testing & CI

| Layer             | Tool                           | Target                                                                   |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Domain unit tests | Vitest + fast-check            | **100%** of `src/domain` — it's pure, there's no excuse                  |
| Component tests   | Vitest + Testing Library       | Log flow, repeat warning modal, settings persistence                     |
| Migration test    | Vitest                         | v1 localStorage → v2 IndexedDB, including malformed input                |
| E2E               | Playwright (Chromium + WebKit) | First-run onboarding → log an injection → see it in history → export CSV |
| Accessibility     | `axe-core` in Playwright       | Zero critical violations on every route, both themes                     |
| Lighthouse        | `treosh/lighthouse-ci-action`  | Perf ≥95, A11y = 100, Best Practices ≥95, SEO ≥95 on the landing page    |
| Visual regression | Playwright snapshots           | Optional — nice, but flaky; add last if at all                           |

**`.github/workflows/ci.yml`** on every PR and push to main:

```
lint (eslint + prettier) → typecheck (tsc --noEmit) → unit (vitest, coverage → Codecov)
  → build (turbo build) → e2e (playwright) → a11y (axe) → lighthouse (landing only)
```

Branch protection on `main`: CI must pass. Badges in the README (CI, coverage, live app). Dependabot weekly.

---

## 7. Execution plan

Seven phases. Each ends at a state you could show someone. Don't skip Phase 0 — writing correct copy is harder than writing correct code here, and everything else depends on it.

| Phase                    | Work                                                                                                                                                                                                                                                                                          | Ends when                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **0 — Truth pass**       | Resolve §1.3 contradictions. Rewrite `CLAUDE.md` and `README.md` against the final report. Extract the content inventory (numbers, specs, FMEA rows, quotes) into `apps/web/content/`. Confirm team credits with the group.                                                                   | Every public claim traces to a line in the final report.                        |
| **1 — Foundation**       | **Tag `v1.0.0` and push the `v1` branch first** (§2.1). Then restructure in place: pnpm + Turborepo scaffold, `apps/web` (Next), `apps/app` (Vite), `packages/ui` with shared tokens, v1 moved to `legacy/v1/`. ESLint/Prettier/tsconfig presets. CI skeleton. Add repo description + topics. | `pnpm dev` runs both; `/v1` still serves the original; CI green on an empty PR. |
| **2 — Domain first**     | Port and upgrade the three algorithms into `src/domain` **with tests written alongside**. No UI yet.                                                                                                                                                                                          | 100% coverage on domain; property tests pass.                                   |
| **3 — App rewrite**      | Rebuild the 4 tabs on top of the domain layer. Port the SVG dial, spotlight cards, CountUp, ClickSpark. Zustand store, IndexedDB, migration, PWA. Keep every WCAG behaviour from v1 — arrow-key navigation, focus trapping, live regions.                                                     | App at parity with v1 + tested + typed. Deployed to `app.rotaguide.vercel.app`. |
| **4 — E2E + a11y gates** | Playwright flows, axe, Lighthouse in CI. Screenshot pipeline (§4.4).                                                                                                                                                                                                                          | Badges green. Screenshots auto-generated.                                       |
| **5 — Landing page**     | Build the 7 sections. Device SVG + V1→V2 morph. App carousel. Results with caveats. Ethics section. Case-study page (§3.3). OG image.                                                                                                                                                         | Live at `rotaguide.vercel.app`, Lighthouse ≥95, reads well on a phone.          |
| **6 — Sync (optional)**  | Supabase project, RLS migrations, magic-link auth, consent screen, sync toggle, export/delete, ADR.                                                                                                                                                                                           | Sync works and stays off by default.                                            |
| **7 — Polish**           | README with hero image + badges. `docs/decisions/` ADRs. Clean up commit history if needed. Custom domain if you want one. Pin the repo on your profile.                                                                                                                                      | You'd send the link to a hiring manager without a caveat.                       |

**Suggested branch flow:** `main` protected; feature branches `phase-1-scaffold`, `feat/domain-recommend`, `feat/landing-device-section`; Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) — cheap to do, and it makes the commit list look deliberate.

---

## 8. Risks

| Risk                                                            | Mitigation                                                                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope creep — Supabase and the landing page both expand forever | Phases 0–5 are the deliverable. Phase 6 is optional and clearly marked as such. Ship 5 before starting 6.                                   |
| Rewrite loses v1's accessibility work                           | v1's ARIA/keyboard behaviour is genuinely good. Write the a11y E2E tests in Phase 2, _before_ the rewrite, so they act as a regression net. |
| Landing page overclaims and undermines the ethics section       | Every number on the page cites the report. Caveats get equal visual weight. Copy review against the §1.5 banned-words list before launch.   |
| Teammate objects to how they're credited                        | Ask the group before publishing. It's a 4-author report from a 5-person team — settle it now, not after it's live.                          |
| Low-res render is the only device asset                         | Rebuilding it as SVG (§3.4) removes the dependency entirely.                                                                                |
| Health-data-shaped project attracts scrutiny                    | The "not a medical device / Health Canada Class II" statement is prominent, not buried in a footer.                                         |

---

## 9. Open questions

1. **Page 2** — case study (A), process log (B), or something else? Default: A.
2. **Moodboard** — drop the images in the chat. Everything visual in §3.4 is provisional until then.
3. **Team credits** — 4 report authors vs. 5 term contributors. And: has everyone agreed to be named on a public site?
4. **License** — MIT (maximum "please read my code") vs. CC BY-NC (keeps a health-adjacent prototype from being reused commercially). Leaning MIT for the code, with the "not a medical device" notice separate.
5. **Domain** — `rotaguide.vercel.app` or buy something? A custom domain costs ~$15/yr and noticeably raises the register.
6. ~~Retina captures of v1 for a before/after~~ — **resolved.** v1 stays deployed at `/v1` (§2.1), so the case study links the live original instead of a screenshot, and the screenshot pipeline (§4.4) can capture both versions from the same Playwright run.
7. **Is `Assignment/Team/rotaguide-project/` safe to delete?** It looks like an exact duplicate checkout, local only.

---

## 10. Immediate next steps

1. You: answer §9 Q1 and Q3, and upload the moodboard.
2. Me: Phase 0 — rewrite `CLAUDE.md` + `README.md` against the final report, and build the content inventory.
3. Me: Phase 1 — scaffold the monorepo on a `v2-rewrite` branch, wire both Vercel projects, get CI green.
4. Then Phase 2 onward, one phase per working session, each ending in something deployed.

---

### References (as cited in the final report)

[1] Deng et al., _J Diabetes Investig_ 9(3):536–543, 2017 · [3] Tian et al., _J Diabetes Sci Technol_ 17(6), 2023 · [4] Mader et al., _Diabetes Technol Ther_ 26(6):384–396, 2024 · [6] Mader et al., _J Diabetes Sci Technol_, 2025 · [7] Klarskov et al., _J Diabetes Sci Technol_ 15(5):1057–1063, 2021 · [24] APEGA Code of Ethics · [25] Health Canada, Medical Devices Regulations (SOR/98-282) · [26] ISO 13485:2016
