# CLAUDE.md — RotaGuide Project Context

> This file is read automatically by Claude Code. It contains everything needed to understand, build, and improve this project.

## What This Project Is

**RotaGuide** is a low-cost guided insulin injection-site rotation system designed for a university BME capstone course (BMEN 668, University of Calgary). It has two components:

1. **Physical prototype** — A 3D-printed rotational dial guide that a user places on their body (abdomen, thigh, arm). It has 12 injection port holes arranged radially. A detent mechanism (magnets + spring-loaded ball bearing) clicks the dial forward one zone at a time, so the user always knows "inject here next." A top indicator plate has an arrow showing the active zone.

2. **Digital tracker web app** (`public/index.html`) — A lightweight mobile-first web app that mirrors the physical dial's 12 zones. Users tap to log which zone they injected in, and the app tracks rotation adherence, highlights recommended next zones, warns about repeat-site use, and visualizes patterns over time.

The clinical problem being solved: **lipohypertrophy (LH)** — when people inject insulin into the same spot repeatedly, subcutaneous tissue thickens, causing unpredictable insulin absorption and dangerous blood sugar swings. 38% of insulin users develop LH, and failure to rotate sites has a pooled odds ratio of ~8.85 for LH.

## Team & Constraints

- **Team:** 5 students (Qummar/PM, Ramtin/Tech, Shayan/Design, Prabjot/Research+Validation, Ben/Docs+Comms)
- **Course:** BMEN 668, instructor Dr. Farago
- **Budget:** ≤$100 CAD total
- **Timeline:** Feb 2 – Apr 10, 2026
- **Target users:** Adults using multiple daily insulin injections (MDI) with pens, including older adults with vision/dexterity limitations

## Repository Structure

```
rotaguide/
├── CLAUDE.md              ← You are here (project context for Claude Code)
├── README.md              ← Public-facing repo README
├── package.json           ← For Firebase hosting deployment
├── firebase.json          ← Firebase hosting config
├── public/
│   ├── index.html         ← Complete self-contained tracker web app (THE main deliverable)
│   ├── manifest.json      ← PWA manifest (app name, icons, theme colour)
│   └── sw.js              ← Service worker (cache-first, offline support)
├── docs/
│   ├── build_guide.md     ← Step-by-step physical prototype build instructions
│   ├── project_proposal.md ← Summary of the full project proposal document
│   └── technical_specs.md  ← Engineering specifications table
└── .github/
    └── (future: CI/CD workflows)
```

## Current State of the Web App

### Architecture
The app is a **single self-contained HTML file** with inline CSS and vanilla JavaScript. No build tools, no framework dependencies, no bundler. This was intentional — it deploys instantly to Firebase free tier with zero config.

### Key Design Decisions
- **12 zones** on the radial dial (matching the physical prototype's 12 injection ports)
- **6 body regions:** Abdomen L, Abdomen R, Thigh L, Thigh R, Arm L, Arm R
- **localStorage** for persistence (key: `rotaguide_v2`) — all data stays on-device for privacy
- **Recommended zone logic:** Finds the least-recently-used zone for the selected body region and highlights it with a pulsing glowing green arc around that sector
- **Repeat-site warnings:** If a user selects a zone that was used within their last N injections (configurable threshold, default 5), a modal warns them about LH risk before logging
- **Adherence calculation:** % of consecutive injections that used a different zone or different region than the previous one
- **PWA:** Service worker caches `index.html` and Google Fonts for offline use; `manifest.json` enables "Add to Home Screen" on iOS and Android

### App Sections (tabs)
1. **Log** — Body region selector + radial SVG dial with 12 colored zone sectors. Tap a zone → tap "Log" button. Shows usage counts per zone and the recommended next zone (glowing green arc). ← → arrow keys also cycle zones; Enter/Space logs.
2. **History** — Stats row (total logs, day streak, adherence % — all CountUp-animated), scrollable list of recent injections with delete capability.
3. **Insights** — Zone usage heatmap (7-day / 30-day toggle), injections-per-day bar chart, rotation adherence progress bar, per-region adherence breakdown, repeat-site alert cards.
4. **Settings** — Zone count (6/8/10/12), repeat warning threshold (3/5/8), dark mode toggle, CSV export, clear all data.

### Fonts & Styling
- **DM Sans** (body/UI) + **JetBrains Mono** (numbers/stats) via Google Fonts CDN
- Warm neutral palette: `#F7F5F2` background, `#2D7A5F` accent green, `#C75B39` warning orange
- Dark mode: `[data-theme="dark"]` overrides CSS custom properties; toggle in Settings, persisted in localStorage
- 12 distinct zone colors defined in the `ZONE_COLORS` array
- Mobile-first, max-width 480px, designed for one-handed use during injection routine
- CSS custom properties for all colors/spacing — never hardcode hex in component logic

### Visual Design (react-bits inspired, vanilla JS/CSS)
- **SVG dial** — radial shine gradient overlay per sector; bg-color sector gap strokes (no white hairlines); drop-shadow on entire SVG; thin outer border ring at R=120; three-layer glass center circle (shadow + white fill + accent ring, r=44); sector labels show clean zone number only (e.g. "1" not "Z1"), usage count only when >0 at 55% opacity
- **Recommended zone indicator** — green triangular arrow (`<polygon class="rec-arrow">`) sits just outside the dial ring, tip at R+7, base at R+18, pointing inward; pulses 1→0.35 opacity with `pulse-arrow` keyframes
- **Recently-used zones** — 0.6 opacity (was 0.3) + diagonal SVG `#hatch` pattern overlay (45° lines, 5px pitch)
- **Selected zone** — `feColorMatrix` brightness boost (×1.3) + soft white `feDropShadow` via `#selBright` filter; white inner arc border along donut edge
- **SpotlightCard** — mouse-tracking radial gradient follows cursor across every `.card`
- **Log button** — green gradient + sweeping shimmer animation + lift/shadow on hover (`ShinyText` pattern)
- **CountUp** — stat numbers ease-out animate when History tab opens
- **ClickSpark** — canvas spark burst from Log button on successful log
- **Section transitions** — tabs fade + slide up (0.22s) on switch

### Accessibility (WCAG 2.2)
- `role="tablist/tab/tabpanel"` on navigation; `aria-selected` kept in sync
- `role="dialog" aria-modal="true" aria-labelledby` on both modals
- `role="status" aria-live="polite"` on toast notifications
- `role="group" aria-label` on SVG dial; each sector has `aria-label`, `aria-pressed`, `role="button"`
- Settings gear wrapped in `<button aria-label="Open settings">`
- `:focus-visible` green ring on all keyboard-focusable elements
- Arrow keys (←→↑↓) navigate zones; Enter/Space logs
- Focus moves into modal on open; returns to trigger on close

### Onboarding
- 4-step first-launch tutorial overlay (react-bits `Stepper` pattern — vanilla JS)
- Progress dots animate between steps; Skip button; "Got it ✓" on final step
- `tutorialDone` flag persisted in localStorage — shows once per device

### Data Model
```javascript
// Each injection log entry:
{
  id: string,        // unique ID (timestamp base36 + random)
  region: string,    // e.g. 'abdomen-L', 'thigh-R'
  zone: number,      // 0-11 (displayed as 1-12 to user)
  timestamp: string  // ISO 8601
}

// State shape (persisted to localStorage key 'rotaguide_v2'):
{
  zoneCount: 12,
  threshold: 5,
  tutorialDone: false,
  darkMode: false,
  selectedRegion: 'abdomen-L',
  selectedZone: null | number,
  logs: LogEntry[]
}
```

### Remaining Limitations / Future Work
1. **No tests** — zero test coverage; Playwright e2e tests would be the right fit
2. **localStorage only** — data lost if browser storage is cleared; no cloud backup
3. **Adherence algorithm is simple** — only checks "different from previous"; doesn't account for spatial proximity between zones
4. **CSV export only** — could support PDF reports for sharing with clinicians
5. **No data validation** — doesn't prevent impossible states (e.g., logging faster than humanly possible)
6. **No notification/reminder system** — Web Notifications API could prompt daily injection reminders
7. **Single HTML file** — fine for this project scope; a component-based framework would help if the app grows significantly

## Technical Specifications (from the proposal)

| Spec | Target | How to Verify |
|------|--------|---------------|
| Min injection site spacing | ≥20mm ± 2mm between consecutive sites | Calipers on physical prototype port centers |
| Physical guide positioning accuracy | ≤±5mm alignment error | Mark-through test on paper |
| Needle clearance | 4–8mm pen needle penetration clearance | Insert pen needle through each port |
| Material biocompatibility | ISO 10993 skin-contact safe, non-irritating | Material data sheets (PLA + silicone for prototype) |
| Guide durability | ≥500 uses without mechanical failure | 50-cycle stress test, extrapolate |
| Cleaning tolerance | Withstands alcohol wipe cleaning ≥1×/use | 10-wipe label/adhesion test |
| Digital tracking resolution | Injection location recorded within ±10mm | Software zone mapping validation |
| Logging time per injection | ≤15 seconds per entry | Stopwatch during usability testing |
| UI readability | Text/icons legible at ≥14pt font equivalent | Visual inspection, accessibility audit |

## Deployment

**Firebase Hosting** (free tier) — already configured in `firebase.json`:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public directory: public/
firebase deploy
```

The app is `public/index.html` — no build step required. PWA works over HTTPS (Firebase provides this automatically).

**GitHub Pages** alternative: Settings → Pages → branch `main`, folder `/public`.

## Commands

```bash
# Local dev — open directly in browser (SW/PWA won't activate without HTTPS)
start public/index.html        # Windows
open public/index.html         # macOS

# Deploy to Firebase
firebase deploy

# Run tests (not yet configured)
npm test
```

## Key References

1. Deng et al., "Prevalence of lipohypertrophy in insulin-treated diabetes patients," J Diabetes Investigation, 2017 — pooled LH prevalence of 38%
2. Mader et al., "Risk factors for Lipohypertrophy," J Diabetes Sci Technol, 2025 — failure to rotate sites: odds ratio ≈8.85
3. Tian et al., "Lipohypertrophy and Insulin: An Update from the Diabetes Technology Society," 2023 — LH linked to unpredictable absorption
4. Mader et al., "Relationship between lipohypertrophy, glycemic control, and insulin dosing," 2024 — LH associated with hypoglycemia (pOR ≈6.98), glycemic variability (pOR ≈5.24), worse HbA1c (+0.55%)
5. Klarskov et al., "ROTO Track: A New Medical Device for Improved Rotation of Insulin Injections," 2021 — proof-of-concept for rotation logging

## Style Guide for Contributors

- Keep the app usable with one hand on a phone screen
- All interactive targets must be ≥44px (mobile tap target minimum)
- Use CSS custom properties for all colors — never hardcode hex in component logic
- Zone colors are in the `ZONE_COLORS` array — add to this array if zone count increases
- Time displays should use `en-CA` locale (Canadian English, 24h format)
- All user-facing text should be plain language (grade 6 reading level) — the target users include older adults
- Privacy first: never transmit injection data off-device without explicit user consent
- Dark mode: override only `--bg`, `--surface`, `--surface-alt`, `--text`, `--text-muted`, `--accent-light`, `--warn-light` under `[data-theme="dark"]`
