import { describe, expect, it } from 'vitest';
import { ID_PATTERN, toKebabId, uniqueId } from '../../src/utils/ids';

describe('toKebabId', () => {
  it.each([
    ['Battery', 'battery'],
    ['Bat & Alt Master', 'bat-alt-master'],
    ['EIS/CAS', 'eis-cas'],
    ['  Anti-Ice  ', 'anti-ice'],
    ['Pack 1+2+3', 'pack-1-2-3'],
    ['Café Crème', 'cafe-creme'],
    ['GLOW annunciator', 'glow-annunciator'],
    ['--Flaps--', 'flaps'],
  ])('%j → %j', (label, id) => {
    expect(toKebabId(label)).toBe(id);
  });

  it('falls back to "item" when nothing usable is left', () => {
    expect(toKebabId('°')).toBe('item');
    expect(toKebabId('')).toBe('item');
  });

  it('always produces a valid id', () => {
    for (const label of ['A', 'N1 / N2', '60–92% (chart)', '日本語', 'x__y']) {
      expect(toKebabId(label)).toMatch(ID_PATTERN);
    }
  });
});

describe('uniqueId', () => {
  it('returns the base when free', () => {
    expect(uniqueId('flaps', new Set(['battery']))).toBe('flaps');
  });

  it('suffixes -2, -3 on collision', () => {
    expect(uniqueId('flaps', new Set(['flaps']))).toBe('flaps-2');
    expect(uniqueId('flaps', new Set(['flaps', 'flaps-2']))).toBe('flaps-3');
  });

  it('skips suffixes already taken by real items (e.g. "flaps-2" meaning Flaps 2)', () => {
    expect(uniqueId('flaps', new Set(['flaps', 'flaps-1', 'flaps-2', 'flaps-3']))).toBe('flaps-4');
  });
});
