import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('Aircrafts List Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSanityMocks(page);
    await page.goto('/aircrafts');
  });

  test('should have no accessibility violations', async ({ page, makeAxeBuilder }) => {
    await page.waitForSelector('text=LOADING_ASSETS...', { state: 'detached' });
    await page.waitForTimeout(1000);
    const results = await makeAxeBuilder().disableRules(['color-contrast']).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('aircraft cards grid components should have proper semantic elements', async ({ page }) => {
    // Wait for the loading state to finish
    await page.waitForSelector('text=LOADING_ASSETS...', { state: 'detached' });
    // Ensure all images in aircraft cards have appropriate alt text or role="presentation"
    const aircraftImages = page.locator('img');
    const count = await aircraftImages.count();

    for (let i = 0; i < count; i++) {
      const img = aircraftImages.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      // If it is an image, it must have either an alt attribute or a role="presentation" (if decorative)
      expect(alt !== null || role === 'presentation').toBe(true);
    }
  });
});
