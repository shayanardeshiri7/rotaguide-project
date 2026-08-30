/**
 * Screenshot pipeline.
 *
 * Seeds deterministic demo data, drives the built app to each state the
 * site wants to show, and writes retina PNGs into the web app's public
 * folder. Running this from the real build is the only way the marketing
 * screenshots stay honest — a hand-captured PNG goes stale the moment
 * the UI changes, and nobody notices.
 *
 *   pnpm --filter @rotaguide/app build
 *   pnpm --filter @rotaguide/app preview &
 *   pnpm --filter @rotaguide/app screens
 */

import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, '../../web/public/screens');
const BASE_URL = process.env['SCREENS_URL'] ?? 'http://127.0.0.1:4173';

/** Fixed instant so the "days ago" strings never shift between runs. */
const SEED_NOW = Date.parse('2026-04-10T09:15:00Z');
const DAY = 86_400_000;

interface SeedEntry {
  region: string;
  zone: number;
  daysAgo: number;
  hour: number;
}

/**
 * A fortnight of plausible use: mostly good rotation, with one repeated
 * site so the caution state has something real to show.
 */
const SEED: SeedEntry[] = [
  { region: 'abdomen-L', zone: 0, daysAgo: 13, hour: 8 },
  { region: 'abdomen-R', zone: 11, daysAgo: 13, hour: 20 },
  { region: 'thigh-L', zone: 4, daysAgo: 12, hour: 8 },
  { region: 'abdomen-L', zone: 7, daysAgo: 12, hour: 20 },
  { region: 'abdomen-R', zone: 2, daysAgo: 11, hour: 8 },
  { region: 'thigh-R', zone: 9, daysAgo: 11, hour: 20 },
  { region: 'abdomen-L', zone: 3, daysAgo: 10, hour: 8 },
  { region: 'arm-L', zone: 5, daysAgo: 10, hour: 20 },
  { region: 'abdomen-R', zone: 6, daysAgo: 9, hour: 8 },
  { region: 'thigh-L', zone: 10, daysAgo: 9, hour: 20 },
  { region: 'abdomen-L', zone: 8, daysAgo: 8, hour: 8 },
  { region: 'abdomen-R', zone: 1, daysAgo: 7, hour: 8 },
  { region: 'thigh-R', zone: 4, daysAgo: 6, hour: 8 },
  { region: 'abdomen-L', zone: 11, daysAgo: 5, hour: 8 },
  { region: 'arm-R', zone: 2, daysAgo: 4, hour: 20 },
  { region: 'abdomen-L', zone: 5, daysAgo: 3, hour: 8 },
  { region: 'abdomen-L', zone: 5, daysAgo: 2, hour: 8 },
  { region: 'thigh-L', zone: 7, daysAgo: 1, hour: 8 },
  { region: 'abdomen-R', zone: 9, daysAgo: 0, hour: 8 },
];

const SHOTS = [
  { name: '01-log', tab: 'Log', note: 'Zone dial and one-tap logging' },
  { name: '02-history', tab: 'History', note: 'History and rotation stats' },
  { name: '03-insights', tab: 'Insights', note: 'Heatmap and adherence' },
  { name: '04-settings', tab: 'Settings', note: 'Settings, export, privacy' },
] as const;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();

  for (const theme of ['light', 'dark'] as const) {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
      deviceScaleFactor: 3, // retina
      colorScheme: theme,
      reducedMotion: 'reduce', // no half-finished fades in a still image
    });

    const page = await context.newPage();

    // Seed before the app boots, so it hydrates straight into a
    // populated state rather than animating counters from zero.
    await page.addInitScript(
      ({ seed, now, day }) => {
        const logs = seed.map((entry, index) => ({
          id: `seed-${index}`,
          region: entry.region,
          zone: entry.zone,
          timestamp: new Date(
            now - entry.daysAgo * day + (entry.hour - 9) * 3_600_000,
          ).toISOString(),
        }));

        window.localStorage.setItem(
          'rotaguide_v2',
          JSON.stringify({
            zoneCount: 12,
            threshold: 5,
            tutorialDone: true,
            darkMode: false,
            logs,
          }),
        );
      },
      { seed: SEED, now: SEED_NOW, day: DAY },
    );

    await page.goto(BASE_URL);
    await page.waitForSelector('[role="tablist"]');

    // The migration import runs on hydration and raises a toast
    // confirming it. Let that expire before capturing — it is correct
    // behaviour, but it would sit over the marketing screenshots.
    await page.waitForTimeout(600);
    await page.locator('.toast').waitFor({ state: 'detached', timeout: 10_000 });

    for (const shot of SHOTS) {
      await page.getByRole('tab', { name: shot.tab }).click();
      await page.waitForTimeout(250);
      const file = resolve(OUT_DIR, `${shot.name}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`captured ${shot.name}-${theme}.png — ${shot.note}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nScreens written to ${OUT_DIR}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
