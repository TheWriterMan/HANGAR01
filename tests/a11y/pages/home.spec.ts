import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('Home Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupSanityMocks(page);
    await page.goto('/');
  });

  test('should have no accessibility violations on initial load', async ({ makeAxeBuilder }) => {
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('FAQ accordion sections should maintain accessibility when toggled', async ({
    page,
    makeAxeBuilder,
  }) => {
    // Find all accordion buttons specifically in FAQ Section
    const accordionButtons = page.locator('button[id^="faq-btn-"]');
    const count = await accordionButtons.count();

    if (count > 0) {
      // Test the first FAQ accordion
      const firstButton = accordionButtons.first();

      // Ensure aria attributes are set correctly
      await expect(firstButton).toHaveAttribute('aria-expanded', 'false');

      // Expand accordion
      await firstButton.click();
      await expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Wait for framer-motion slide down or state toggle
      await page.waitForTimeout(300);

      // Scan the main content including the FAQ section
      const faqScan = await makeAxeBuilder().include('main').analyze();
      expect(faqScan.violations, formatViolations(faqScan.violations)).toEqual([]);
    }
  });
});
