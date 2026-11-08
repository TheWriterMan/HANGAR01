import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('News Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSanityMocks(page);
    await page.goto('/news');
  });

  test('should have no accessibility violations', async ({ page, makeAxeBuilder }) => {
    await page.waitForSelector('text=Loading posts...', { state: 'detached' });
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
