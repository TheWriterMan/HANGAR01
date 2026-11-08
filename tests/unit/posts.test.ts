import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { postCardImageUrl } from '../../src/utils/images';
import { deriveExcerpt } from '../../src/utils/posts';

describe('deriveExcerpt', () => {
  it('keeps a link’s text and drops its address', () => {
    expect(deriveExcerpt('From [the first jet](https://example.com/a-b) on.', 150)).toBe(
      'From the first jet on....',
    );
  });

  it('keeps hyphens inside words and drops list markers', () => {
    expect(deriveExcerpt('The E-Jets ship.\n\n- Opt-In reports\n* More', 150)).toBe(
      'The E-Jets ship. Opt-In reports More...',
    );
  });

  it('drops images, headings and emphasis', () => {
    expect(deriveExcerpt('## Title\n\n![alt](/a.webp)\n\n**Bold** text', 150)).toBe(
      'Title Bold text...',
    );
  });
});

describe('post covers', () => {
  it('every WebP cover has the 1000 px card copy beside it', () => {
    const dir = path.resolve(__dirname, '../../content/posts');
    for (const file of fs.readdirSync(dir)) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      for (const match of raw.matchAll(/^(?:timage|bannerImage):\s*['"]?([^'"\n]*\.webp)/gm)) {
        const card = postCardImageUrl(match[1]);
        expect(fs.existsSync(path.resolve(__dirname, '../../public' + card)), card).toBe(true);
      }
    }
  });
});
