# Technical Specifications

## Physical Prototype

| # | Specification | Target / Tolerance | Justification |
|---|--------------|-------------------|---------------|
| 1 | Minimum site spacing (rotation distance) | ≥20 mm between consecutive injection sites ± 2 mm | Clinical injection guidelines recommend spacing to prevent repeated tissue trauma and lipohypertrophy |
| 2 | Physical guide positioning accuracy | Alignment error ≤ ±5 mm | Ensures guide reliably maps intended injection zones without excessive precision demands |
| 3 | Compatible injection needle length range | 4–8 mm needle penetration clearance | Covers most commonly prescribed insulin pen needles |
| 4 | Material biocompatibility | ISO 10993 skin-contact safe; non-irritating | Repeated skin contact; material must not cause irritation or degradation |
| 5 | Guide reusability & durability | ≥500 uses without mechanical failure | Daily insulin users require long-term reuse |
| 6 | Cleaning & hygiene tolerance | Withstands alcohol wipe cleaning ≥1×/use | Must be easily disinfected without degrading material or markings |

## Digital Tracker

| # | Specification | Target / Tolerance | Justification |
|---|--------------|-------------------|---------------|
| 7 | Digital tracking location resolution | Injection location recorded within ±10 mm | Meaningful rotation pattern visualization without precise anatomical mapping |
| 8 | Logging time per injection | ≤15 seconds per entry | Minimizes user burden for long-term adherence |
| 9 | User interface readability | Text/icons legible at ≥14 pt font equivalent | Accessibility for users with reduced vision or older adults |

## Measurable Success Metrics

- **Rotation Adherence:** % of injections following intended rotation site spacing rule
- **Repeat-site Reduction:** Reduction in same-zone injections vs baseline week
- **Time Burden:** Average time to select a site for injection (target ≤15s)
- **User Confidence:** Self-reported confidence in rotation (Likert scale)
- **System Usability Scale (SUS):** Post-task usability surveys during testing sessions

## Physical Prototype Dimensions

- **Base plate:** ~120mm × 100mm × 5mm (rounded rectangle/ellipse)
- **Zone dial:** ~110mm diameter × 4mm thick circular disc
- **Indicator ring:** Same outer dimension as base, ~3mm thick
- **Injection ports:** 12 holes, 10mm diameter each, at ~35mm radius from center
- **Central pivot:** M3 bolt assembly with nylon washers
- **Detent magnets:** 8 neodymium disc magnets (6mm × 2mm) at ~40mm radius
- **Skin interface:** 1–2mm silicone pad on base underside

## Material Bill

| Component | Material | Reason |
|-----------|----------|--------|
| All 3D-printed parts | PLA filament | Low cost, widely available, non-toxic for prototype use |
| Skin-contact pad | Medical-grade silicone sheet | Comfort, grip, hypoallergenic, easy to clean |
| Detent magnets | N52 neodymium disc | Strong enough click feel at small size |
| Detent ball | 4–5mm steel ball bearing | Durable, smooth rolling surface |
| Pivot hardware | M3 stainless steel bolt + nylon lock nut | Corrosion resistant, adjustable tension |
| Friction reducers | Nylon washers | Smooth rotation, prevents PLA grinding |
