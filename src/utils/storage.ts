/**
 * localStorage wrappers that never throw. Storage can be unavailable (private
 * mode, disabled cookies, sandboxed iframes), full, or hold corrupt values.
 * In every case the app falls back to in-memory state.
 */

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota exceeded or storage disabled — keep in-memory state only */
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage disabled */
  }
}

/** Parses a stored JSON value. Returns null when missing, unparsable or rejected by `isValid`. */
export function readJSON<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  const raw = readStorage(key);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
