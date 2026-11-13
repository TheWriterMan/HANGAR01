import { readStorage, removeStorage, writeStorage } from './storage';

/**
 * Anonymous usage counts, sent to HANGAR01's own collector on Cloudflare
 * (e.hangar01.space). Each event carries only its name, the listed values, the
 * page path and the host of an outside referrer. No cookies, no ID, never which
 * items were ticked and never anything typed. The collector rejects any other
 * event name, key or value.
 *
 * Nothing is sent from automated browsers, on localhost, or when this browser
 * has opted out: opening any page with ?count=off sets that, ?count=on clears it.
 */

const ENDPOINT = 'https://e.hangar01.space/e';
const OPT_OUT_KEY = 'count';

export type ChecklistView = 'quick' | 'normal' | 'full';

/** Every event and its values. Keep in step with the collector and the privacy page. */
export interface UsageEvents {
  page_view: Record<string, never>;
  checklist_open: { aircraft: string; view: ChecklistView };
  view_switch: { aircraft: string; from: ChecklistView; to: ChecklistView };
  checklist_leave: {
    aircraft: string;
    view: ChecklistView;
    /** How many items in the current view are ticked. */
    ticked: number;
    /** Id of the furthest phase with a ticked item, or "none". */
    phase: string;
    /** Minutes the checklist was open, to one decimal. */
    minutes: number;
    /** This browser had ticks or a chosen view saved for the aircraft before it opened. */
    returning: boolean;
  };
  print: { aircraft: string; view: ChecklistView };
  report_open: { aircraft: string };
  report_sent: { aircraft: string };
}

/** Reads ?count=off / ?count=on from the address and remembers the choice. */
export function applyCountSwitch(search: string = window.location.search): void {
  const value = new URLSearchParams(search).get('count');
  if (value === 'off') writeStorage(OPT_OUT_KEY, 'off');
  else if (value === 'on') removeStorage(OPT_OUT_KEY);
}

/** Whether this browser should send events at all. */
export function countingEnabled(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (navigator.webdriver) return false;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '') return false;
  return readStorage(OPT_OUT_KEY) !== 'off';
}

let referrerSent = false;

/**
 * The host of the page that sent the visitor here, on the first event of a page
 * load only, and only when it is another site. Empty otherwise.
 */
function referrerHost(): string {
  if (referrerSent) return '';
  referrerSent = true;
  try {
    const host = new URL(document.referrer).hostname;
    return host && host !== window.location.hostname ? host : '';
  } catch {
    return '';
  }
}

/** A My Hangar checklist's address carries the visitor's own id, so it is sent as /hangar/local. */
const publicPath = (path: string) => path.replace(/^\/hangar\/[^/]+\/?$/, '/hangar/local');

/**
 * The same for a full address, for Vercel Analytics and Speed Insights (their
 * `beforeSend`). Anything that isn't a URL passes through unchanged.
 */
export function maskLocalChecklistUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const masked = publicPath(parsed.pathname);
    if (masked === parsed.pathname) return url;
    parsed.pathname = masked;
    return parsed.toString();
  } catch {
    return url;
  }
}

/** The JSON the collector receives. Exported for the tests. */
export function eventBody<N extends keyof UsageEvents>(
  name: N,
  values: UsageEvents[N],
  path: string = window.location.pathname,
): string {
  return JSON.stringify({ n: name, p: values, u: publicPath(path), r: referrerHost() });
}

/**
 * Sends one event. Never throws and never delays the page. `path` defaults to
 * the current page, and is given when the address has already moved on.
 */
export function track<N extends keyof UsageEvents>(
  name: N,
  values: UsageEvents[N],
  path?: string,
): void {
  try {
    if (!countingEnabled()) return;
    const body = eventBody(name, values, path);
    const blob = new Blob([body], { type: 'text/plain' });
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(ENDPOINT, blob)) return;
    void fetch(ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  } catch {
    /* counting must never break the site */
  }
}
