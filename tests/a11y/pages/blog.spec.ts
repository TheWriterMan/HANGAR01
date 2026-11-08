import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('Blog Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSanityMocks(page);
    await page.goto('/news/hangar01-v1-is-live');
  });

  test('should have no accessibility violations', async ({ page, makeAxeBuilder }) => {
    await page.waitForSelector('text=Retrieving Datalink...', { state: 'detached' });
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('blog heading hierarchy and details should be structured correctly', async ({ page }) => {
    await page.waitForSelector('text=Retrieving Datalink...', { state: 'detached' });
    // Assert that we have exactly one h1 tag for page title
    const h1Headers = page.locator('h1');
    await expect(h1Headers).toHaveCount(1);
  });
});
