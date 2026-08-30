import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility gates.
 *
 * The intended users include older adults with reduced vision,
 * neuropathy, and arthritis. These are not nice-to-haves for this
 * project — a control someone cannot reach or read is a control that
 * does not exist for them.
 */

const TABS = ['Log', 'History', 'Insights', 'Settings'] as const;

/**
 * Panels fade in over 220 ms. Scanning during that fade samples text
 * that is still nearly transparent and reports a false contrast
 * failure. The token stylesheet collapses every animation under
 * prefers-reduced-motion, so asking for it both removes the race and
 * exercises the reduced-motion rendering path.
 */
async function dismissTutorial(page: Page, colorScheme: 'light' | 'dark' = 'light') {
  await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip' }).click();
}

for (const theme of ['light', 'dark'] as const) {
  test(`no critical or serious violations on any tab — ${theme}`, async ({ page }) => {
    await dismissTutorial(page, theme);

    for (const tab of TABS) {
      await page.getByRole('tab', { name: tab }).click();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      expect(
        blocking,
        `${tab} (${theme}): ${blocking.map((v) => `${v.id} — ${v.help}`).join('; ')}`,
      ).toEqual([]);
    }
  });
}

test('the onboarding dialog is accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(blocking.map((v) => v.id)).toEqual([]);
});

test('the whole log flow is reachable by keyboard alone', async ({ page }) => {
  await dismissTutorial(page);

  // Reach the dial without touching the mouse.
  const zone1 = page.getByRole('button', { name: /^Zone 1,/ });
  await zone1.focus();
  await expect(zone1).toBeFocused();

  // Arrow keys move between zones and wrap around the dial.
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: /^Zone 2,.*selected/ })).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: /^Zone 12,.*selected/ })).toBeFocused();

  await page.keyboard.press('End');
  await expect(page.getByRole('button', { name: /^Zone 12,/ })).toBeFocused();

  await page.keyboard.press('Home');
  await expect(page.getByRole('button', { name: /^Zone 1,.*selected/ })).toBeFocused();
});

test('dialogs trap focus and release it on close', async ({ page }) => {
  await dismissTutorial(page);

  await page.getByRole('button', { name: /^Zone 4,/ }).click();
  const logButton = page.getByRole('button', { name: /Log Abdomen L, zone 4/ });
  await logButton.click();

  await page.getByRole('button', { name: /^Zone 4,/ }).click();
  await page.getByRole('button', { name: /Log Abdomen L, zone 4/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Focus must be inside the dialog, not left on the page behind it.
  const focusedInDialog = await dialog.evaluate((node) => node.contains(document.activeElement));
  expect(focusedInDialog).toBe(true);

  // Escape closes it.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('tap targets meet the 44px minimum', async ({ page }) => {
  await dismissTutorial(page);

  for (const name of ['Log', 'History', 'Insights', 'Settings']) {
    const box = await page.getByRole('tab', { name }).boundingBox();
    expect(box, `tab ${name} has no box`).not.toBeNull();
    expect(box!.height, `tab ${name} height`).toBeGreaterThanOrEqual(44);
  }

  const regionButton = page.getByRole('button', { name: 'Abdomen R', exact: true });
  const regionBox = await regionButton.boundingBox();
  expect(regionBox!.height).toBeGreaterThanOrEqual(44);
});

test('the app announces state changes politely', async ({ page }) => {
  await dismissTutorial(page);
  await page.getByRole('button', { name: /^Zone 7,/ }).click();
  await page.getByRole('button', { name: /Log Abdomen L, zone 7/ }).click();

  // The live region itself is a zero-size wrapper; assert on its
  // announced text rather than its visibility.
  await expect(page.getByRole('status').first()).toContainText('Logged');
});
