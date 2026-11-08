import { defineConfig } from 'vitest/config';

// Unit tests only. Accessibility tests in tests/a11y/ run under Playwright.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
