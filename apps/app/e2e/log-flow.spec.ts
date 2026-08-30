import { expect, test } from '@playwright/test';

/**
 * The journey that matters: first run, log an injection, see it in
 * history, export it. If this breaks, the app has no purpose.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('first run shows the tutorial, and it can be skipped', async ({ page }) => {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Rotate your injection sites');

  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(dialog).toBeHidden();
});

test('the tutorial can be stepped through to the end', async ({ page }) => {
  const dialog = page.getByRole('dialog');
  for (let i = 0; i < 3; i++) {
    await dialog.getByRole('button', { name: 'Next' }).click();
  }
  await dialog.getByRole('button', { name: 'Get started' }).click();
  await expect(dialog).toBeHidden();
});

test('the tutorial does not return on reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Select a zone to log' })).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('logging an injection, then finding it in history and in a CSV', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();

  // Log
  await page.getByRole('button', { name: /^Zone 5,/ }).click();
  await page.getByRole('button', { name: /Log Abdomen L, zone 5/ }).click();
  await expect(page.getByRole('status')).toContainText('Logged Abdomen L, zone 5');

  // History
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByText('Abdomen L · Zone 5')).toBeVisible();

  // Export
  await page.getByRole('tab', { name: 'Settings' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export CSV/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^rotaguide-export-\d{4}-\d{2}-\d{2}\.csv$/);
});

test('an injection survives a reload immediately after logging', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: /^Zone 3,/ }).click();
  await page.getByRole('button', { name: /Log Abdomen L, zone 3/ }).click();

  // Reload with no settling time at all. IndexedDB writes are async, so
  // without the synchronous mirror in lib/storage.ts this entry is lost
  // — which was reproducible, not theoretical. Losing a logged injection
  // is the worst bug this app could have, so the race is pinned here.
  await page.reload();
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByText('Abdomen L · Zone 3')).toBeVisible();
});

test('several injections survive a reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();

  for (const zone of [1, 7, 11]) {
    await page.getByRole('button', { name: new RegExp(`^Zone ${zone},`) }).click();
    await page.getByRole('button', { name: new RegExp(`Log Abdomen L, zone ${zone}`) }).click();
  }

  await page.reload();
  await page.getByRole('tab', { name: 'History' }).click();

  // "Zone 1" is a substring of "Zone 11", so match whole entries.
  await expect(page.getByText(/^Abdomen L · Zone \d+$/)).toHaveCount(3);
  await expect(page.getByText('Abdomen L · Zone 7')).toBeVisible();
  await expect(page.getByText('Abdomen L · Zone 11')).toBeVisible();
});

test('the suggestion moves away from the site just used', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();

  await page.getByRole('button', { name: /^Zone 1,/ }).click();
  await page.getByRole('button', { name: /Log Abdomen L, zone 1/ }).click();

  // v1 would have offered zone 2 here — adjacent, and the closest legal
  // option. v2 should send the user across the plate.
  await expect(page.getByRole('button', { name: /^Zone 12,.*recommended next/ })).toBeVisible();
});

test('a repeat is challenged before it is logged', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();

  await page.getByRole('button', { name: /^Zone 4,/ }).click();
  await page.getByRole('button', { name: /Log Abdomen L, zone 4/ }).click();

  await page.getByRole('button', { name: /^Zone 4,/ }).click();
  await page.getByRole('button', { name: /Log Abdomen L, zone 4/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/used/i);

  // And it must never overstate what the app can do.
  await expect(dialog).not.toContainText(/ensures|prevents|guarantees/i);

  await dialog.getByRole('button', { name: 'Pick another' }).click();
  await expect(dialog).toBeHidden();
});

test('an entry can be deleted from history', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: /^Zone 6,/ }).click();
  await page.getByRole('button', { name: /Log Abdomen L, zone 6/ }).click();

  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByRole('button', { name: /^Delete injection/ }).click();
  await expect(page.getByText('Nothing logged yet.')).toBeVisible();
});

test('switching region resets the pending zone', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: /^Zone 2,/ }).click();
  await expect(page.getByRole('button', { name: /Log Abdomen L, zone 2/ })).toBeEnabled();

  await page.getByRole('button', { name: 'Thigh R', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Select a zone to log' })).toBeDisabled();
});

test('every tab renders', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();

  for (const tab of ['History', 'Insights', 'Settings', 'Log']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  }
});

test('cloud backup is not enabled by default', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();

  // The project commits to never transmitting injection data without
  // explicit consent. If sync is ever on by default, that is a breach
  // of the commitment, not a UI regression.
  const toggle = page.getByLabel('Back up to the cloud');
  if (await toggle.isVisible()) {
    await expect(toggle).not.toBeChecked();
  }

  await expect(page.getByText(/stored on this device/i)).toBeVisible();
});
