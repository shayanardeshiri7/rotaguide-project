/**
 * Content inventory — the single source of truth for every public claim.
 *
 * Rules for this file:
 *  1. Every number carries a `source` naming where it came from. If it
 *     cannot be traced to the final report, it does not go on the site.
 *  2. Caveats are data, not decoration. They render with the same weight
 *     as the results they qualify.
 *  3. Banned words (see BANNED_CLAIMS): the project's own ethics analysis
 *     names false reassurance as its top risk. Nothing here may say the
 *     system ensures, prevents, or guarantees anything.
 */

export const PROJECT = {
  name: 'RotaGuide',
  tagline: 'A physical guide and a tracker for insulin injection-site rotation.',
  course: 'BMEN 668 — Biomedical Engineering Design',
  institution: 'University of Calgary',
  term: 'February – April 2026',
  repo: 'https://github.com/shayanardeshiri7/rotaguide-project',
} as const;

/**
 * Copy that must never appear anywhere on the site or in the app.
 * Enforced by a test, not by good intentions.
 */
export const BANNED_CLAIMS = [
  'ensures',
  'ensure',
  'prevents',
  'prevent',
  'guarantees',
  'guarantee',
  'eliminates',
  'cures',
  'treats',
  'medically approved',
  'clinically proven',
] as const;

// ── The clinical problem ─────────────────────────────────────────────

export interface Stat {
  readonly value: string;
  readonly label: string;
  readonly detail: string;
  readonly source: string;
}

export const PROBLEM_STATS: readonly Stat[] = [
  {
    value: '38%',
    label: 'of insulin users develop lipohypertrophy',
    detail:
      'Pooled prevalence across 26 studies and 12,493 participants. Repeated injection into one area thickens the subcutaneous tissue.',
    source: 'Deng et al., J Diabetes Investig 9(3):536–543, 2017',
  },
  {
    value: '8.85',
    label: 'odds ratio from failing to rotate sites',
    detail:
      'Not rotating is the single strongest modifiable risk factor identified in the literature.',
    source: 'Mader et al., J Diabetes Sci Technol, 2025',
  },
  {
    value: '+0.55%',
    label: 'higher HbA1c where lipohypertrophy is present',
    detail:
      'Also associated with hypoglycaemia (pOR 6.98) and glycaemic variability (pOR 5.24) — insulin absorbs unpredictably from affected tissue.',
    source: 'Mader et al., Diabetes Technol Ther 26(6):384–396, 2024',
  },
];

export const PRIOR_ART = [
  {
    approach: 'Patient education',
    limitation: 'Depends on recall at the moment of injection, several times a day, for years.',
  },
  {
    approach: 'Logging apps',
    limitation: 'Record what you tell them. Nothing connects the log to where the needle goes.',
  },
  {
    approach: 'Smart insulin pens',
    limitation: 'Brand-locked to one manufacturer and priced well beyond a low-cost intervention.',
  },
  {
    approach: 'Paper rotation charts',
    limitation: 'Static. They cannot show which site is due next given what you actually did.',
  },
] as const;

// ── The device ───────────────────────────────────────────────────────

export const DEVICE = {
  // The physical guide is a rectangular plate, not a rotating dial. The
  // dial in the app is a UI metaphor; earlier drafts of the project docs
  // conflated the two.
  form: 'A flat 3D-printed plate with numbered circular ports, placed on the skin.',
  material: 'PLA, printed on a consumer FDM printer',
  specs: [
    { label: 'Ports', value: '12', note: 'Numbered 1–12, four columns by three rows' },
    { label: 'Port diameter', value: '10 mm', note: 'Clears 4–8 mm pen needles' },
    {
      label: 'Port spacing',
      value: '30 mm',
      note: 'Against a ≥20 mm requirement — deliberately conservative',
    },
    { label: 'Plate thickness', value: '8 mm', note: 'Rigidity against portability' },
    { label: 'V1 footprint', value: '~12 × 8 cm', note: 'Abdomen and thigh' },
    { label: 'V2 footprint', value: '~6 × 8 cm', note: 'Fewer zones per placement; fits the arm' },
  ],
  iteration: {
    finding: 'The V1 plate was too large to sit flat on a curved upper arm.',
    change:
      'V2 trades zones per placement for a smaller footprint, and adds a notched reference edge.',
    why: 'The notch can be found by touch, so the plate can be aligned without looking at it.',
  },
} as const;

// ── Test results ─────────────────────────────────────────────────────

export interface TestResult {
  readonly metric: string;
  readonly spec: string;
  readonly result: string;
  readonly meets: boolean;
}

/** n = 5, simulated use. April results supersede the March status table. */
export const TEST_RESULTS: readonly TestResult[] = [
  { metric: 'Logging time per injection', spec: '≤ 15 s', result: '11.4 s median', meets: true },
  {
    metric: 'Guide placement accuracy',
    spec: '≤ ±5 mm',
    result: '2.6 mm average error, 100% within tolerance',
    meets: true,
  },
  { metric: 'Comfort', spec: '≥ 4 / 5', result: '4.0 / 5', meets: true },
  { metric: 'Ease of use', spec: 'not specified', result: '4.4 / 5', meets: true },
  { metric: 'Rotation clarity', spec: 'not specified', result: '4.8 / 5', meets: true },
  { metric: 'App usability', spec: 'not specified', result: '4.4 / 5', meets: true },
];

/**
 * The five specifications that were never verified. These are listed,
 * not hidden — four of nine verified is the honest headline.
 */
export const UNVERIFIED_SPECS = [
  {
    spec: 'Material biocompatibility (ISO 10993)',
    blocker: 'Requires accredited materials testing.',
  },
  { spec: 'Durability ≥ 500 uses', blocker: 'Requires a mechanical cycling rig.' },
  { spec: 'Alcohol-wipe cleaning tolerance', blocker: 'Requires a repeated-exposure protocol.' },
  {
    spec: 'Digital tracking resolution ±10 mm',
    blocker: 'Requires measuring real injection sites against logged zones.',
  },
  { spec: 'UI readability ≥ 14 pt equivalent', blocker: 'Requires a formal accessibility audit.' },
] as const;

export const TEST_CAVEATS = [
  'n = 5 participants. This is a usability signal, not a clinical finding.',
  'Testing was simulated — the guide was placed on clothing and foam, never on skin, and no insulin was injected.',
  'One older participant found the rigid plate uncomfortable on the abdomen.',
  'Four of nine technical specifications were verified. The other five could not be determined within the course budget and timeline.',
] as const;

// ── Risk analysis ────────────────────────────────────────────────────

export const FMEA_TOP_RISKS = [
  {
    mode: 'User injects through the wrong port',
    mitigation: 'Numbered ports, a single highlighted next zone, and an in-app confirmation step.',
    rpnBefore: 252,
    rpnAfter: 96,
  },
  {
    mode: 'Guide creates false confidence in rotation quality',
    mitigation:
      'The app states what it does and does not know, and never claims an outcome. No streak rewards for logging.',
    rpnBefore: 240,
    rpnAfter: 96,
  },
  {
    mode: 'Cross-contamination from a reused, uncleaned guide',
    mitigation: 'Single-user device; cleaning step documented in the build guide.',
    rpnBefore: 180,
    rpnAfter: 54,
  },
] as const;

export const REGULATORY = {
  status: 'Not a medical device.',
  detail:
    'RotaGuide is a student engineering prototype built for a university course. It has not been evaluated by any regulator and does not provide medical advice.',
  ifCommercialised:
    'Marketed as a medical device in Canada, this would likely be Class II — requiring a Medical Device Licence and an ISO 13485 quality management system.',
  source: 'Health Canada, Medical Devices Regulations (SOR/98-282); ISO 13485:2016',
} as const;

export const BUDGET = {
  spent: '$17',
  ceiling: '$100',
  breakdown: [
    { item: 'Alcohol wipes', cost: '$10' },
    { item: 'Contingency', cost: '$7' },
    { item: 'Hosting', cost: '$0' },
    { item: 'Design tooling', cost: '$0' },
  ],
  note: 'Printing used the university makerspace. The point of the project was a low-cost intervention, and the build reflects that.',
} as const;

// ── Credits ──────────────────────────────────────────────────────────

export const CREDITS = {
  team: 'A five-person team across project management, mechanical design, research and validation, and software.',
  myRole:
    'I built the digital side: the tracker application, the rotation algorithms, and this site.',
  note: 'Teammates are credited by role rather than by name.',
} as const;

// ── What changed in v2 ───────────────────────────────────────────────

export const V2_CHANGES = [
  {
    title: 'A recommendation that understands distance',
    before:
      'v1 suggested the least-recently-used zone by index — which would send you from port 1 to port 2, the closest legal option.',
    after:
      'v2 scores every port by its distance from your recent sites, weighted by how recent they are, and suggests the one furthest away.',
  },
  {
    title: 'Rotation measured in millimetres',
    before: 'v1 counted a pair as adherent whenever the zone index differed.',
    after:
      'v2 measures the actual separation in the plate geometry and scores it against the ≥20 mm specification.',
  },
  {
    title: 'A tested core',
    before: 'v1 was a single 56 KB HTML file with no tests.',
    after:
      'The rotation logic is now a pure module with no framework dependencies, at 100% test coverage including property-based tests.',
  },
  {
    title: 'Warnings with states, not booleans',
    before: 'v1 showed one modal whenever a zone repeated.',
    after:
      'v2 distinguishes no risk, caution, and warning, so a single repeat does not carry the same weight as a pattern.',
  },
] as const;

export const REFERENCES = [
  'Deng et al., “Prevalence of lipohypertrophy in insulin-treated diabetes patients,” J Diabetes Investig 9(3):536–543, 2017.',
  'Tian et al., “Lipohypertrophy and Insulin: An Update from the Diabetes Technology Society,” J Diabetes Sci Technol 17(6), 2023.',
  'Mader et al., “Relationship between lipohypertrophy, glycemic control, and insulin dosing,” Diabetes Technol Ther 26(6):384–396, 2024.',
  'Mader et al., “Risk factors for lipohypertrophy,” J Diabetes Sci Technol, 2025.',
  'Klarskov et al., “ROTO Track: A New Medical Device for Improved Rotation of Insulin Injections,” J Diabetes Sci Technol 15(5):1057–1063, 2021.',
  'Health Canada, Medical Devices Regulations (SOR/98-282).',
  'ISO 13485:2016, Medical devices — Quality management systems.',
] as const;
