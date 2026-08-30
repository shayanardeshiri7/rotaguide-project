# RotaGuide — Injection Site Rotation Tracker

> A low-cost guided insulin injection-site rotation system to reduce lipohypertrophy risk.

**BMEN 668 Capstone — University of Calgary**
Team: Qummar Mahmood · Ramtin Chelongarian · Shayan Ardeshiri · Prabjot Sanghera · Ben Penny

---

## The Problem

**38%** of insulin users develop lipohypertrophy (LH) — thickened subcutaneous tissue from repeated injections in the same spot. LH causes unpredictable insulin absorption, blood sugar swings, and a 7× increased hypoglycemia risk. The leading cause: failure to rotate injection sites (odds ratio ≈ 8.85).

Existing solutions (education, apps, smart pens) are memory-dependent, brand-locked, or too expensive. None physically enforce rotation at the point of injection.

---

## The Solution

RotaGuide is a two-part system:

### 1. Physical Dial Guide (~$75 CAD)
A 3D-printed rotational dial the user places on their body. A detent mechanism (neodymium magnets + spring-loaded ball bearing) clicks forward one zone per use — no memory required. 12 injection ports, ≥20mm apart, with a silicone skin interface.

### 2. Digital Tracker (this repo)
A mobile-first progressive web app that mirrors the dial's zones. Tap to log, see what to use next, and track your rotation habits over time.

---

## Digital Tracker Features

| Feature | Details |
|---|---|
| **Zone dial** | SVG radial dial with 6–12 configurable zones; pulsing arrow indicator outside the ring marks the recommended next zone; diagonal-hatch overlay on recently-used zones |
| **Smart recommendation** | Highlights the least-recently-used zone per body region; selected zone shown with brightness boost and inner arc border |
| **Repeat-site warnings** | Modal alert before logging a recently overused zone |
| **6 body regions** | Abdomen L/R · Thigh L/R · Arm L/R |
| **History** | Last 30 injections with animated stats (streak, adherence %) |
| **Insights** | Zone heatmap (7d / 30d), daily bar chart, per-region adherence breakdown |
| **Dark mode** | Full token-swap dark theme, persisted across sessions |
| **Onboarding** | 4-step first-launch tutorial for new users |
| **PWA** | Installable on iOS/Android; works fully offline after first load |
| **Accessibility** | WCAG 2.2 — ARIA roles, keyboard navigation (← → to cycle zones), focus management, screen-reader announcements |
| **Privacy** | All data stored on-device (localStorage); nothing transmitted off-device |
| **CSV export** | Download injection log for clinician review |

---

## Quick Start

**Open locally** (no install needed):
```
open public/index.html      # macOS
start public/index.html     # Windows
```

**Deploy to Firebase** (live HTTPS URL, full PWA):
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

**GitHub Pages alternative:** Settings → Pages → branch `main`, folder `/public`

> PWA offline mode and "Add to Home Screen" require HTTPS (Firebase or GitHub Pages provide this automatically).

---

## Repo Structure

```
├── public/
│   ├── index.html       ← Complete app (single file, no build step)
│   ├── manifest.json    ← PWA manifest
│   └── sw.js            ← Service worker (offline cache)
├── docs/
│   ├── build_guide.md        ← Physical prototype assembly
│   ├── technical_specs.md    ← Engineering specifications
│   └── project_proposal.md   ← Clinical rationale & design decisions
├── CLAUDE.md            ← AI context file (architecture, style guide)
├── firebase.json        ← Firebase hosting config
└── package.json
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | Zero build step, instant Firebase deploy |
| Storage | `localStorage` | On-device privacy, no backend needed |
| Hosting | Firebase Hosting | Free HTTPS, PWA-compatible |
| Fonts | Google Fonts (DM Sans + JetBrains Mono) | Cached by service worker |
| Physical | PLA + neodymium magnets + medical silicone | ≤$75 CAD, biocompatible |

---

## Clinical References

1. Deng et al. — LH prevalence 38% in insulin users *(J Diabetes Investigation, 2017)*
2. Mader et al. — Failure to rotate: OR ≈ 8.85 for LH *(J Diabetes Sci Technol, 2025)*
3. Tian et al. — LH linked to unpredictable absorption *(Diabetes Technology Society, 2023)*
4. Mader et al. — LH → hypoglycemia pOR 6.98, worse HbA1c +0.55% *(2024)*
5. Klarskov et al. — ROTO Track device proof-of-concept *(2021)*

---

## License

Academic use — BMEN 668, University of Calgary, 2026.
