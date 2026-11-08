import type { Page } from '@playwright/test';
import type { AxeResults } from 'axe-core';

/**
 * Formats axe violations into a highly readable string for test output.
 */
export function formatViolations(violations: AxeResults['violations']): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map(
          (n) =>
            `  - Selector: ${n.target.join(', ')}\n    HTML: ${n.html}\n    Summary: ${n.failureSummary}`,
        )
        .join('\n');
      return `[${(v.impact ?? 'unknown').toUpperCase()}] ${v.id}: ${v.help}\nHelp URL: ${v.helpUrl}\n${nodes}`;
    })
    .join('\n\n');
}

/**
 * No-op — retained for backward compatibility with existing test files.
 * The frontend reads from static JSON files bundled in /content/ — no external
 * API calls to mock.
 */
export async function setupSanityMocks(_page: Page) {
  // No-op.
}
