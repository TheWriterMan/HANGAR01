import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('Checklist Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await setupSanityMocks(page);
    await page.goto('/aircrafts/b737');
  });

  test('should have no accessibility violations on load', async ({ page, makeAxeBuilder }) => {
    // Wait for the loading state to finish
    await page.waitForSelector('text=Loading checklist…', { state: 'detached' });
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('checklist item toggle interaction should remain accessible', async ({
    page,
    makeAxeBuilder,
  }) => {
    // Wait for the loading state to finish
    await page.waitForSelector('text=Loading checklist…', { state: 'detached' });
    // Find item checkbox or row button
    const checklistItemBtn = page
      .locator('button[role="checkbox"], input[type="checkbox"]')
      .first();

    if (await checklistItemBtn.isVisible()) {
      // Toggle item check state
      await checklistItemBtn.click();

      // Let transition finish
      await page.waitForTimeout(100);

      // Scan checklist container
      const itemScan = await makeAxeBuilder().include('main').analyze();
      expect(itemScan.violations, formatViolations(itemScan.violations)).toEqual([]);
    }
  });

  test('depth mode toggle should be accessible when switching quick/normal/full modes', async ({
    page,
    makeAxeBuilder,
  }) => {
    // Wait for the loading state to finish
    await page.waitForSelector('text=Loading checklist…', { state: 'detached' });
    // Find the segments of ModeToggle
    const modeToggle = page.locator('button[role="radio"]:visible');
    const count = await modeToggle.count();

    if (count > 0) {
      // Click the first segment
      await modeToggle.first().click();
      await page.waitForTimeout(200);

      // Re-scan
      const results = await makeAxeBuilder().analyze();
      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    }
  });
});
