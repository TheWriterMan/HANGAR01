import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('Contact Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSanityMocks(page);
    await page.goto('/contact');
  });

  test('should have no accessibility violations on load', async ({ makeAxeBuilder }) => {
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('form field errors and labels should be accessible', async ({ page, makeAxeBuilder }) => {
    // 1. Verify standard form fields have associated labels or ARIA descriptions (excluding honeypot)
    const inputs = page.locator(
      'input[type="text"]:not([name="_honeypot"]), input[type="email"], textarea',
    );
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const name = (await input.getAttribute('name')) || (await input.getAttribute('id'));
      const hasLabel =
        (await page.locator(`label[for="${name}"]`).isVisible()) ||
        (await input.getAttribute('aria-label')) !== null;
      expect(hasLabel).toBe(true);
    }

    // 2. Submit form empty to trigger validation errors
    const submitBtn = page.locator('main form button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Let errors render
      await page.waitForTimeout(200);

      // Verify that error states are accessible (using aria-invalid or aria-describedby)
      const errorScan = await makeAxeBuilder().include('form').analyze();
      expect(errorScan.violations, formatViolations(errorScan.violations)).toEqual([]);
    }
  });
});
