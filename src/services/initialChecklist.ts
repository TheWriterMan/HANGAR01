import { createContext } from 'react';
import { Aircraft } from '../types';

/** Id of the `<script type="application/json">` the prerender embeds on checklist pages. */
export const CHECKLIST_DATA_ID = 'checklist-data';

/**
 * The checklist a prerendered page was built with. Lets the first render show
 * the checklist without fetching it. Client-side navigation still fetches.
 */
export const InitialChecklistContext = createContext<Aircraft | null>(null);

/** Reads the checklist embedded in a prerendered page, if there is one. */
export function readEmbeddedChecklist(): Aircraft | null {
  const el = document.getElementById(CHECKLIST_DATA_ID);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as Aircraft;
  } catch {
    return null;
  }
}
