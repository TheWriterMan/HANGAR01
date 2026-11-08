import { test as base, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'best-practice',
      ]);
    await use(makeAxeBuilder);
  },

  page: async ({ page }, use) => {
    // Kill Framer Motion WAAPI animations by overriding Element.prototype.animate
    await page.addInitScript(() => {
      const origAnimate = Element.prototype.animate;
      Element.prototype.animate = function (
        this: Element,
        keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
        options?: number | KeyframeAnimationOptions,
      ) {
        const anim = origAnimate.call(this, keyframes, options);
        try {
          anim.finish();
        } catch {
          // Some animations can't be finished (infinite, etc) — cancel them
          try {
            anim.cancel();
          } catch {
            // Already cancelled or detached — nothing to do.
          }
        }
        return anim;
      };

      // Inject CSS to kill CSS transitions/animations and override inline opacity:0
      const style = document.createElement('style');
      style.id = '__a11y-kill-motion';
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.documentElement.appendChild(style);

      // MutationObserver: any element getting opacity < 1 via inline style → force 1
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.attributeName === 'style') {
            const el = m.target as HTMLElement;
            const op = el.style?.opacity;
            if (op && op !== '' && parseFloat(op) < 1) {
              el.style.opacity = '1';
              el.style.transform = 'none';
            }
          }
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'],
        subtree: true,
      });
    });

    // After every goto, wait briefly for the init script to process mutations
    const origGoto = page.goto.bind(page);
    page.goto = async (url: string, options?: Parameters<Page['goto']>[1]) => {
      const resp = await origGoto(url, options);
      // Allow the MutationObserver + WAAPI finish to process
      await page.waitForTimeout(300);
      return resp;
    };

    await use(page);
  },
});

export { expect } from '@playwright/test';
export type { AxeResults } from 'axe-core';
