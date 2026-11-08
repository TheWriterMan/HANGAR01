import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('Changelog Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSanityMocks(page);
    await page.goto('/changelog');
  });

  test('should have no accessibility violations', async ({ makeAxeBuilder }) => {
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
