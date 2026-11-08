import { test, expect } from '../fixtures';
import { formatViolations, setupSanityMocks } from '../helpers';

test.describe('Shared Layout Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // No-op setup (static content, no external API to mock)
    await setupSanityMocks(page);
    // Navigate to homepage
    await page.goto('/');
  });

  test('should pass automated scans for desktop header and footer layout', async ({
    page,
    makeAxeBuilder,
  }) => {
    // 1. Footer scan
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const footerScan = await makeAxeBuilder().include('footer').analyze();
    expect(footerScan.violations, formatViolations(footerScan.violations)).toEqual([]);

    // 2. Header scan
    const header = page.locator('header');
    await expect(header).toBeVisible();
    const headerScan = await makeAxeBuilder().include('header').analyze();
    expect(headerScan.violations, formatViolations(headerScan.violations)).toEqual([]);
  });

  test('skip-to-content link should be keyboard accessible', async ({ page }) => {
    // The skip-to-content link should be the first tabbable element
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // It should be visually hidden initially but visible on focus
    // Check if the locator has text (means it is rendered)
    await expect(skipLink).toContainText('Skip to content');
  });

  test('mobile header navigation drawer should be accessible', async ({ page, makeAxeBuilder }) => {
    // Set viewport to mobile size to trigger hamburger menu button
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for header to be visible
    await expect(page.locator('header')).toBeVisible();

    // Click the toggle button to open mobile nav if visible
    const menuBtn = page.locator('header button').first(); // fallback if aria-label differs
    if (await menuBtn.isVisible()) {
      await menuBtn.click();

      // Let transition finish
      await page.waitForTimeout(300);

      // Scan mobile navigation drawer specifically
      const navScan = await makeAxeBuilder().include('header').analyze();
      expect(navScan.violations, formatViolations(navScan.violations)).toEqual([]);
    }
  });
});
