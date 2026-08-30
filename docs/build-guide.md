# RotaGuide — Physical Prototype Build Guide

## Rotational Dial Injection-Site Rotation System (Concept B)

**Team:** Group 3 — BMEN 668  
**Budget:** ≤$100 CAD total  
**Timeline:** Feb 2 – Apr 10, 2026

---

## Shopping List — Components to Buy

| #   | Item                                         | Qty          | Est. Cost (CAD) | Where to Buy           | Notes                                                     |
| --- | -------------------------------------------- | ------------ | --------------- | ---------------------- | --------------------------------------------------------- |
| 1   | Neodymium disc magnets (6mm × 2mm)           | 1 pack (20+) | $17.99          | Amazon.ca              | For detent indexing — creates the "click" between zones   |
| 2   | Silicone sheet (1–2mm thick, food/skin-safe) | 1 sheet      | $15.00          | Amazon.ca              | Skin-contact interface pad; cut to fit base of guide      |
| 3   | Small compression springs (6mm OD × 10mm)    | 4–6          | $5.00           | McMaster-Carr / Amazon | For detent mechanism plunger (spring-loaded ball)         |
| 4   | Steel ball bearings (4mm or 5mm)             | 6            | $3.00           | Amazon.ca / McMaster   | Detent ball — sits in spring, clicks into magnet recesses |
| 5   | M3 machine screws + nuts (assorted 8–16mm)   | 1 pack       | $5.00           | Amazon.ca / Home Depot | Central pivot assembly + securing layers                  |
| 6   | M3 flat washers + nylon washers              | 1 pack       | $2.00           | Amazon.ca              | Reduce friction on pivot; nylon for smooth rotation       |
| 7   | Alcohol wipes (70% isopropyl)                | 1 box        | $10.00          | Shoppers / Amazon      | Cleaning validation testing                               |
| 8   | Sandpaper (220 + 400 grit)                   | 2 sheets     | $3.00           | Home Depot             | Post-print finishing — smooth edges, remove layer lines   |
| 9   | Cyanoacrylate (super glue)                   | 1 tube       | $3.00           | Dollar store / Amazon  | Bonding magnets into recesses, securing silicone pad      |
| 10  | Label maker tape or vinyl sticker sheet      | 1            | $4.00           | Staples / Amazon       | High-contrast zone labels (backup if printed labels fade) |
| 11  | Contingency                                  | —            | $7.00           | —                      | Reprints, replacement parts                               |
|     | **TOTAL**                                    |              | **~$75**        |                        | Under $100 budget ✓                                       |

**3D Printing:** Use your university's Schulich/Engineering maker space — PLA filament is typically provided free or at minimal cost. If unavailable, a spool of PLA is ~$25.

**Tools you'll need access to (not purchased):** 3D printer (FDM), calipers, hobby knife/deburring tool, drill with 3mm bit.

---

## Architecture Overview

The prototype has **three stacked layers** that rotate relative to each other around a central pivot:

```
        ┌─────────────────────────────┐
        │  TOP PLATE (Indicator Ring) │  ← Stationary — has arrow/window
        ├─────────────────────────────┤
        │  MIDDLE PLATE (Zone Dial)   │  ← Rotates — has 8 labeled zones + injection holes
        ├─────────────────────────────┤
        │  BOTTOM PLATE (Base)        │  ← Sits on skin (silicone pad underneath)
        └─────────────────────────────┘
                     │
              Central M3 bolt
              (pivot axis)
```

**How it works:** The user places the base on their body region, then rotates the middle dial one "click" (detent) to advance to the next zone. The top plate's arrow/window shows which zone is active. They inject through the open hole in that zone.

---

## Step-by-Step Build Process

### PHASE 1: CAD Design (Week 1–2)

You already have an early CAD zone-template. Here's what each part needs:

#### 1A. Bottom Plate (Base)

- **Shape:** Rounded rectangle or ellipse, ~120mm × 100mm × 5mm thick
- **Features:**
  - Central hole: 3.2mm diameter (clearance for M3 bolt pivot)
  - Flat bottom surface for silicone pad adhesion
  - Optional: 2–3 alignment nubs on the underside edges (small bumps that help the user feel consistent body placement)
  - Ring of magnet recesses on top face: 8 evenly spaced pockets (6.2mm diameter × 2.2mm deep) at a radius of ~40mm from center — these hold the magnets that create detent positions
- **Curvature:** Add a gentle convex curve on the bottom (radius ~300mm) to better conform to the abdomen. If this is too complex for V1, start flat and test.

#### 1B. Middle Plate (Zone Dial)

- **Shape:** Circular disc, ~110mm diameter × 4mm thick
- **Features:**
  - Central hole: 3.2mm (pivot)
  - **8 injection port holes:** Evenly spaced around the disc at radius ~35mm from center, each hole is 10mm diameter (allows needle + pen tip clearance for 4–8mm pen needles)
  - **Zone labels:** Embossed or recessed numbers "1" through "8" next to each hole (at least 3mm deep text for tactile feedback)
  - **Detent interface on underside:** A small spring-loaded pocket at radius ~40mm — this holds the compression spring + ball bearing that clicks into the base plate's magnet recesses
  - **Chamfered edges** on all injection holes (1mm × 45°) for comfort and to guide the needle
- **Color coding:** If your printer supports multi-color or pause-and-swap, print alternating zone segments in 2 colors. Otherwise, paint or use colored sticker dots post-print.

#### 1C. Top Plate (Indicator Ring)

- **Shape:** Ring/frame, same outer dimension as base, ~3mm thick, with a large central cutout that reveals the dial underneath
- **Features:**
  - Central hole: 3.2mm (pivot)
  - Arrow or triangular window notch on one edge — this points to the "active" zone
  - The ring covers the edges of the dial but leaves all 8 injection ports visible only through the active window area
  - **Alternative simpler approach:** Instead of a full ring, use a simple pointer arm that extends from the central pivot. Less manufacturing complexity.

#### Design Tips

- **Tolerances:** Design all rotating interfaces with 0.3mm clearance (e.g., if the middle plate is 110mm, the top plate's inner cutout should be 110.6mm)
- **Print orientation:** Print the base and top plate flat. Print the middle dial flat (holes face up)
- **Export as STL** with at least 0.2mm resolution

### PHASE 2: 3D Printing + Post-Processing (Week 3)

#### 2A. Print Settings

| Parameter    | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| Material     | PLA (standard, widely available, skin-safe for prototype use)                         |
| Layer height | 0.16–0.20mm (balances quality and speed)                                              |
| Infill       | 40–50% (needs structural integrity for repeated use)                                  |
| Walls        | 3–4 perimeters                                                                        |
| Supports     | Only for overhangs >45° (the injection holes shouldn't need supports if printed flat) |
| Bed adhesion | Brim (helps with warping on larger flat parts)                                        |

#### 2B. Post-Processing Steps

1. **Remove from bed** carefully with a spatula
2. **Remove brim** with hobby knife
3. **Sand all surfaces** that contact skin (bottom of base) with 220 grit, then 400 grit
4. **Deburr all holes** — use a deburring tool or the tip of a hobby knife to chamfer the injection port edges
5. **Test fit:** Assemble dry (no glue) and verify the middle plate rotates freely on the pivot bolt
6. **Drill out** any tight holes to 3.2mm with a drill bit

### PHASE 3: Detent Mechanism Assembly (Week 3–4)

This is the "click" mechanism that ensures the dial advances exactly one zone per rotation step.

#### 3A. Install Magnets in Base Plate

1. Place a small drop of super glue in each of the 8 magnet recesses on the base plate's top face
2. Press one neodymium disc magnet into each recess, **all with the same polarity facing up**
3. Let cure 10 minutes
4. Verify all 8 magnets are flush with or slightly below the surface

#### 3B. Build the Detent Plunger in the Middle Plate

The underside of the middle dial has a single detent pocket:

1. **Pocket dimensions:** ~7mm diameter × 8mm deep cylindrical cavity, open at the bottom face of the dial
2. Drop in a steel ball bearing (4–5mm)
3. Place a compression spring behind it
4. Cap with a small 3D-printed plug (press-fit or glued) that retains the spring but allows the ball to protrude ~1mm from the bottom face

**How it works:** As the dial rotates, the ball bearing rides along the base plate surface. When it aligns with a magnet recess, the magnet pulls the ball into the pocket → you feel and hear a "click." The spring ensures the ball pops back out when you continue rotating.

**Simpler Alternative (if the spring mechanism is too fiddly):**
Skip the spring + ball. Instead, embed a magnet in the dial's underside (opposite polarity to the base magnets). The magnets attract each other at each zone position. This gives a softer click but is much easier to build.

#### 3C. Central Pivot Assembly

1. Insert an M3 × 20mm bolt through (from the bottom): base plate → nylon washer → middle dial → nylon washer → top plate
2. Secure with an M3 nylon lock nut on top
3. Tighten until the assembly is snug but the middle dial still rotates freely
4. The nylon washers reduce friction and prevent PLA-on-PLA grinding

### PHASE 4: Skin Interface + Labeling (Week 4)

#### 4A. Silicone Pad

1. Cut the silicone sheet to match the base plate's bottom footprint
2. Clean both surfaces with alcohol
3. Apply a thin layer of super glue or silicone adhesive to the base plate bottom
4. Press the silicone pad on, weigh it down, let cure 1 hour
5. The silicone provides grip (prevents sliding during injection) and comfort

#### 4B. Zone Labels

1. Print high-contrast labels: white text on colored backgrounds matching the app's zone colors
2. Apply labels or use a label maker for numbers 1–8 next to each injection port
3. **Minimum font size: 14pt equivalent** (per your accessibility spec)
4. Apply a layer of clear nail polish or clear packing tape over labels to protect from alcohol wipe degradation

#### 4C. Indicator Arrow

1. Paint or apply a bright contrasting sticker (red or yellow) on the top plate's arrow/window position
2. This is the "inject here" indicator

### PHASE 5: Integration + Validation (Week 5–6)

#### 5A. Functional Checks

Run through this checklist:

- [ ] Dial rotates smoothly with one hand
- [ ] Each of the 8 positions produces a tactile click
- [ ] Clicks are distinguishable (no half-positions)
- [ ] Injection ports allow a pen needle to pass through without obstruction (test with a real insulin pen needle cap or similar diameter rod)
- [ ] Zone labels are legible at arm's length
- [ ] Silicone pad grips skin and doesn't slide during simulated injection
- [ ] Assembly survives 50 consecutive rotation cycles without loosening
- [ ] Arrow clearly indicates which zone is active

#### 5B. Hygiene Testing

1. Wipe entire device with alcohol wipe
2. Verify labels remain legible after 10 wipe cycles
3. Verify silicone pad remains adhered after 10 wipe cycles
4. Check that no debris accumulates in the detent mechanism or pivot

#### 5C. Measurement Validation

- Use calipers to verify **≥20mm spacing** between adjacent injection port centers
- Verify **≤±5mm positioning error** by marking through each port onto paper and measuring scatter
- Verify **4–8mm needle clearance** through each port

### PHASE 6: Iteration to V2 (Week 6–7)

Based on your usability testing sessions (SUS + timed trials), prioritize fixes:

1. **Fit issues** → Adjust overall curvature or create S/M/L size variants
2. **Rotation too stiff/loose** → Adjust spring tension, magnet strength, or washer thickness
3. **Labels fading** → Switch to engraved text or more durable coating
4. **Port too small/large** → Resize and reprint middle dial only
5. **Users confused about direction** → Add rotation direction arrow on the dial edge

---

## How the Physical Prototype Maps to the Digital Tracker

| Physical Dial Feature                                 | Digital Tracker Equivalent                                  |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| 8 injection port positions                            | 8 zone sectors on the radial UI                             |
| Body region (user places on abdomen L, thigh R, etc.) | Region selector buttons in the app                          |
| Rotate one click → next zone                          | Tap zone in app → log entry                                 |
| Arrow indicates current zone                          | Dashed "recommended" ring highlights best next zone         |
| No memory of past injections                          | App stores full history, calculates adherence, shows alerts |

**Workflow for the user:**

1. Open app → see which zone/region is recommended
2. Place physical guide on that body region
3. Rotate dial to the recommended zone number
4. Inject through the port
5. Tap the matching zone in the app to log (≤15 seconds)

---

## File Manifest

```
rotaguide/
├── tracker-app/
│   └── index.html          ← Complete web tracker (deploy to Firebase)
├── CAD/                     ← Your SolidWorks/Fusion 360 files
│   ├── base_plate.stl
│   ├── zone_dial.stl
│   └── indicator_ring.stl
└── docs/
    └── build_guide.md       ← This document
```

---

## Deployment: Getting the Tracker App Online

The `index.html` file is a complete, self-contained web application. To deploy on Firebase (free tier):

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting` (select your project, set public directory to `tracker-app/`)
4. Deploy: `firebase deploy`

The app uses `localStorage` for data persistence — no server-side database needed. All data stays on the user's device (privacy-aware, per your spec).

---

## Quick-Reference: Technical Specs vs. Prototype Targets

| Spec                 | Target                                  | How to Verify                       |
| -------------------- | --------------------------------------- | ----------------------------------- |
| Min site spacing     | ≥20mm ± 2mm                             | Calipers on port centers            |
| Positioning accuracy | ≤±5mm                                   | Mark-through test on paper          |
| Needle clearance     | 4–8mm                                   | Insert pen needle through each port |
| Biocompatibility     | PLA + silicone (non-clinical prototype) | Material data sheets                |
| Durability           | ≥500 uses                               | 50-cycle stress test, extrapolate   |
| Cleaning tolerance   | Alcohol wipe 1×/use                     | 10-wipe label/adhesion test         |
| Logging time         | ≤15s per entry                          | Stopwatch during usability testing  |
| UI readability       | ≥14pt equivalent                        | Visual inspection                   |
