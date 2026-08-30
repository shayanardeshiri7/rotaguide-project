# Project Proposal Summary

> Full proposal: "Low-Cost Guided Insulin Injection-Site Rotation System to Reduce Lipohypertrophy Risk" — BMEN 668, University of Calgary, submitted Feb 13, 2026.

## Clinical Problem

Repeated insulin injections into the same small subcutaneous area cause **lipohypertrophy (LH)** — thickened tissue that interferes with insulin absorption and reduces glycemic predictability.

**Key statistics:**

- Pooled LH prevalence: **38%** in insulin-treated individuals (26 studies, 12,493 participants)
- Failure to rotate injection sites: pooled odds ratio **≈ 8.85** for LH
- LH association with unexplained hypoglycemia: pOR ≈ 6.98
- LH association with glycemic variability: pOR ≈ 5.24
- LH association with worse HbA1c: mean difference ≈ +0.55%

## Why Existing Solutions Fail

| Solution Type                            | Limitation                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Education programs & paper rotation maps | Relies on patient memory and motivation; many still inject in familiar spots |
| Smartphone apps (mySugr, etc.)           | Depend on manual input; patients skip or forget; not optimized for rotation  |
| Smart pen ecosystems (InPen)             | Rotation is not primary feature; hardware cost/access barriers               |
| SiteSmart colored pen needles            | Limited to one pen needle brand; doesn't cover all sites                     |
| Wearable injection guides (patented)     | Cumbersome; focuses on placement, not long-term rotation habits              |

**Recurring gap:** No low-cost, brand-agnostic system combines immediate body-map guidance at the point of injection with minimal-burden reinforcement.

## Our Design: Rotational Dial Guide (Concept B)

Three concepts were evaluated:

- **Concept A — Linear sliding guide:** Simple but linear progression doesn't match anatomical rotation patterns
- **Concept B — Rotational dial guide:** ✅ Selected — radial zone layout matches how users conceptualize rotation "around" an injection site
- **Concept C — Modular marker system:** Flexible but high cognitive burden; vulnerable to user workarounds

### Why Concept B Won

- Radial mapping reduces cognitive load and matches anatomical intuition
- Tactile detent clicks support accessibility for users with reduced vision
- Each dial position = discrete zone ID → enables single-tap digital logging
- Mechanically reinforces rotation behavior (not just reminders)
- Feasible to prototype within budget and timeline

## User Needs (Prioritized)

1. **Low friction:** Identify next zone in ≤15 seconds, no complex setup
2. **Clear rotation logic:** System enforces spacing/rotation rules visibly
3. **Comfort and fit:** Reliable alignment across body shapes and injection sites
4. **Hygiene and durability:** Easy to clean; markings survive repeated use
5. **Accessibility:** High-contrast markings, tactile cues for vision/dexterity limitations
6. **Privacy-aware tracking:** Minimal data, offline-capable
7. **Affordability:** Target ≤$15 CAD/unit for physical guide

## User Engagement Plan

- **MDI insulin users (n=5–8):** Rapid usability testing with timed next-site selection trials, SUS surveys, qualitative feedback on comfort/clarity/burden
- **Clinicians/educators (n=1–2):** Feasibility feedback on teachability, infection control, workflow integration
- One iteration cycle (V1 → V2) before final build

## Project Risks (Top 5 by RAS Score)

| Risk                                   | RAS | Mitigation                                                                   |
| -------------------------------------- | --- | ---------------------------------------------------------------------------- |
| Guide doesn't fit diverse body shapes  | 9   | Multiple size variants; early fit checks with foam models                    |
| User bypasses or ignores guide         | 8   | Physical constraint of injection ports + visual feedback in tracker          |
| Tracker interface too complex          | 8   | Minimal inputs (pre-mapped zones, single-tap); early pilot testing           |
| Material hygiene/skin-contact concerns | 7   | PLA + silicone; cleaning protocol; labeled as non-clinical prototype         |
| Scope creep during iteration           | 7   | Freeze requirements early; "no new features" after final iteration milestone |

## Budget

| Item                                             | Cost (CAD) |
| ------------------------------------------------ | ---------- |
| Mechanical hardware (springs, screws, fasteners) | $10.00     |
| Neodymium disc magnets                           | $17.99     |
| Silicone sheet (skin-contact interface)          | $15.00     |
| Alcohol wipes                                    | $10.00     |
| Web app/dashboard hosting (Firebase free tier)   | $0.00      |
| UI prototyping software (Figma free tier)        | $0.00      |
| Contingency                                      | $7.00      |
| **Total**                                        | **$59.99** |

## Timeline Summary

- **Task 1 (Weeks 1–2):** Scope, research, requirements
- **Task 2 (Weeks 2–3):** Concepts + architecture
- **Task 3 (Weeks 3–5):** Prototype V1 (guide + tracker)
- **Task 4 (Weeks 5–6):** Integration + iteration to V2
- **Task 5 (Weeks 6–8):** Verification + usability testing
- **Task 6 (Weeks 8–9):** Final freeze + deliverables
- **Task 7 (Ongoing):** Documentation + comms

## References

[1] Deng et al., J Diabetes Investigation, 2017. doi: 10.1111/jdi.12742
[2] Wang et al., Diabetes Research and Clinical Practice, 2021. doi: 10.1016/j.diabres.2021.108797
[3] Tian et al., J Diabetes Sci Technol, 2023. doi: 10.1177/19322968231187661
[4] Mader et al., Diabetes Technology & Therapeutics, 2024. doi: 10.1089/dia.2023.0491
[5] Gentile et al., Advances in Therapy, 2022. doi: 10.1007/s12325-022-02105-5
[6] Mader et al., J Diabetes Sci Technol, 2025. doi: 10.1177/19322968251325569
[7] Klarskov et al., J Diabetes Sci Technol, 2021. doi: 10.1177/19322968211032280
