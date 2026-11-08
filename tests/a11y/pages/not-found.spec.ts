import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('Not Found Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSanityMocks(page);
    await page.goto('/does-not-exist');
  });

  test('should have no accessibility violations', async ({ makeAxeBuilder }) => {
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
