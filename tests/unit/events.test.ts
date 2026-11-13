import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyCountSwitch, countingEnabled, track } from '../../src/utils/events';

// ─── A minimal browser: localStorage, location, navigator, document ─────────

const store = new Map<string, string>();
const location = { hostname: 'www.hangar01.space', pathname: '/aircraft/a320', search: '' };
const beacon = vi.fn((_url: string, _body: Blob) => true);
const nav: { webdriver: boolean; sendBeacon: typeof beacon } = {
  webdriver: false,
  sendBeacon: beacon,
};

Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    },
    location,
  },
  configurable: true,
});
Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true });
Object.defineProperty(globalThis, 'document', {
  value: { referrer: 'https://www.google.com/search?q=a320+checklist' },
  configurable: true,
});

beforeEach(() => {
  store.clear();
  beacon.mockClear();
  nav.webdriver = false;
  location.hostname = 'www.hangar01.space';
});

const sentBodies = async () =>
  Promise.all(beacon.mock.calls.map(async ([, blob]) => JSON.parse(await blob.text())));

describe('usage events', () => {
  it('sends the name, values, path and outside referrer host, and nothing else', async () => {
    track('checklist_open', { aircraft: 'a320', view: 'normal' });
    track('page_view', {});
    expect(beacon).toHaveBeenCalledTimes(2);
    expect(beacon.mock.calls[0][0]).toBe('https://e.hangar01.space/e');
    expect(beacon.mock.calls[0][1].type).toBe('text/plain');
    const [first, second] = await sentBodies();
    expect(first).toEqual({
      n: 'checklist_open',
      p: { aircraft: 'a320', view: 'normal' },
      u: '/aircraft/a320',
      r: 'www.google.com',
    });
    // The referrer goes with the first event of a page load only.
    expect(second.r).toBe('');
  });

  it('sends nothing from automated browsers or localhost', () => {
    nav.webdriver = true;
    track('page_view', {});
    nav.webdriver = false;
    location.hostname = 'localhost';
    track('page_view', {});
    expect(beacon).not.toHaveBeenCalled();
  });

  it('?count=off stops events in this browser and ?count=on starts them again', () => {
    applyCountSwitch('?count=off');
    expect(countingEnabled()).toBe(false);
    track('page_view', {});
    expect(beacon).not.toHaveBeenCalled();
    applyCountSwitch('?utm_source=x');
    expect(countingEnabled()).toBe(false);
    applyCountSwitch('?count=on');
    expect(countingEnabled()).toBe(true);
  });

  it("sends a My Hangar checklist's address without the visitor's local id", async () => {
    location.pathname = '/hangar/0f8e7c1a-2b3d-4e5f-8a9b-0c1d2e3f4a5b';
    track('page_view', {});
    location.pathname = '/hangar';
    track('page_view', {});
    location.pathname = '/aircraft/a320';
    const [checklist, list] = await sentBodies();
    expect(checklist.u).toBe('/hangar/local');
    expect(list.u).toBe('/hangar');
  });

  it('never throws when sending fails', () => {
    beacon.mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(() => track('page_view', {})).not.toThrow();
  });
});
