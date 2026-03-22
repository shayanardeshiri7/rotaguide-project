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
│   └── index.html         ← Complete self-contained tracker web app (THE main deliverable)
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
- **Recommended zone logic:** Finds the least-recently-used zone for the selected body region and highlights it with a pulsing dashed ring
- **Repeat-site warnings:** If a user selects a zone that was used within their last N injections (configurable threshold, default 5), a modal warns them about LH risk before logging
- **Adherence calculation:** % of consecutive injections that used a different zone or different region than the previous one

### App Sections (tabs)
1. **Log** — Body region selector + radial SVG dial with 12 colored zone sectors. Tap a zone → tap "Log" button. Shows usage counts per zone and the recommended next zone.
2. **History** — Stats row (total logs, day streak, adherence %), scrollable list of recent injections with delete capability.
3. **Insights** — Zone usage heatmap (last 7 days), injections-per-day bar chart (last 7 days), rotation adherence progress bar, repeat-site alert cards.
4. **Settings** — Zone count selector (6/8/10/12, default 12), repeat warning threshold (3/5/8), CSV export, clear all data.

### Fonts & Styling
- **DM Sans** (body/UI) + **JetBrains Mono** (numbers/stats) via Google Fonts CDN
- Warm neutral palette: `#F7F5F2` background, `#2D7A5F` accent green, `#C75B39` warning orange
- 12 distinct zone colors defined in the `ZONE_COLORS` array
- Mobile-first, max-width 480px, designed for one-handed use during injection routine
- CSS custom properties for all colors/spacing (easy to theme)

### Data Model
```javascript
// Each injection log entry:
{
  id: string,        // unique ID (timestamp base36 + random)
  region: string,    // e.g. 'abdomen-L', 'thigh-R'
  zone: number,      // 0-11 (displayed as 1-12 to user)
  timestamp: string  // ISO 8601
}

// State shape:
{
  zoneCount: 12,
  threshold: 5,
  selectedRegion: 'abdomen-L',
  selectedZone: null | number,
  logs: LogEntry[]
}
```

### Known Limitations / Areas for Improvement
1. **Single HTML file** — Works great for prototyping but should be split into proper components (React/Svelte/Vue) for maintainability
2. **No tests** — Zero test coverage currently
3. **localStorage only** — Data is lost if browser data is cleared; no cloud sync or backup
4. **No PWA support** — Should add service worker + manifest for offline use and "Add to Home Screen"
5. **No accessibility audit** — Needs ARIA labels, keyboard navigation, screen reader testing (critical given target users include visually impaired)
6. **SVG dial rendering** — Zone labels get cramped at 12 zones; font sizes and label positioning could be smarter
7. **No dark mode** — CSS variables are set up for it but no toggle exists
8. **Adherence algorithm is simple** — Only checks "different from previous"; doesn't account for spatial proximity of zones or time between injections
9. **No onboarding/tutorial** — New users see the dial cold with no explanation
10. **CSV export only** — Could support PDF reports for sharing with clinicians
11. **No data validation** — Doesn't prevent impossible states (e.g., logging faster than humanly possible)
12. **Heatmap only shows last 7 days** — Should have configurable time ranges
13. **No notification/reminder system** — Could use Web Notifications API for injection reminders

## Technical Specifications (from the proposal)

These are the engineering targets the project must meet:

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

Currently designed for **Firebase Hosting** (free tier):

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set public directory to 'public/'
firebase deploy
```

The entire app is `public/index.html` — no build step required.

## Key References

1. Deng et al., "Prevalence of lipohypertrophy in insulin-treated diabetes patients," J Diabetes Investigation, 2017 — pooled LH prevalence of 38%
2. Mader et al., "Risk factors for Lipohypertrophy," J Diabetes Sci Technol, 2025 — failure to rotate sites: odds ratio ≈8.85
3. Tian et al., "Lipohypertrophy and Insulin: An Update from the Diabetes Technology Society," 2023 — LH linked to unpredictable absorption
4. Mader et al., "Relationship between lipohypertrophy, glycemic control, and insulin dosing," 2024 — LH associated with hypoglycemia (pOR ≈6.98), glycemic variability (pOR ≈5.24), worse HbA1c (+0.55%)
5. Klarskov et al., "ROTO Track: A New Medical Device for Improved Rotation of Insulin Injections," 2021 — proof-of-concept for rotation logging

## Commands

```bash
# Local dev — just open in browser
open public/index.html

# Deploy to Firebase
firebase deploy

# Run tests (TODO — not yet set up)
npm test
```

## Style Guide for Contributors

- Keep the app usable with one hand on a phone screen
- All interactive targets must be ≥44px (mobile tap target minimum)
- Use CSS custom properties for all colors — never hardcode hex in component logic
- Zone colors are in the `ZONE_COLORS` array — add to this array if zone count increases
- Time displays should use `en-CA` locale (Canadian English, 24h format)
- All user-facing text should be plain language (grade 6 reading level) — the target users include older adults
- Privacy first: never transmit injection data off-device without explicit user consent
