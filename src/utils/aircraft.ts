import { ChecklistPhase } from '../types';
import { countItems, filterChecklist } from './checklist';

/**
 * Formats an aircraft's full display name (manufacturer + model + suffix).
 *
 * Suffix rules:
 * - "Combined" is omitted (checklist covers multiple variants).
 * - All other suffixes are concatenated directly — they already include
 *   their own leading separator (space, hyphen, or nothing for e.g. "neo").
 */
export function formatAircraftName(aircraft: {
  manufacturer: string;
  model: string;
  suffix?: string;
}): string {
  const { manufacturer, model, suffix } = aircraft;
  const suffixPart = suffix && suffix !== 'Combined' ? suffix : '';
  // "ATR 42/72" and "HondaJet" already carry the manufacturer.
  const maker = model.startsWith(manufacturer) ? '' : manufacturer;
  return `${maker} ${model}${suffixPart}`.trim();
}

/**
 * Returns just the model + suffix portion (no manufacturer).
 * Used on cards where manufacturer is shown separately.
 *
 * Suffix concatenation:
 * - "Combined" → omitted (handled separately as superscript in UI)
 * - Starts with space or hyphen → concat directly (space/hyphen is built-in)
 * - Otherwise → concat directly with no space (e.g. "neo" → "A320neo")
 */
export function formatModelName(aircraft: { model: string; suffix?: string }): string {
  const { model, suffix } = aircraft;
  if (!suffix || suffix === 'Combined') return model;
  return `${model}${suffix}`;
}

/**
 * The add-on developer people search for ("PMDG 737"). Default aircraft
 * (Microsoft) aren't searched by developer, so they get none.
 */
export function addonPrefix(aircraft: { addon?: string }): string {
  return aircraft.addon && aircraft.addon !== 'Microsoft' ? `${aircraft.addon} ` : '';
}

/** Room left in a 60-character page title after SEO's " — HANGAR01" suffix. */
const TITLE_BUDGET = 60 - ' — HANGAR01'.length;

/**
 * Checklist page title, e.g. "PMDG Boeing 737NG Checklist for MSFS". Takes the
 * longest form that fits the title budget.
 */
export function checklistPageTitle(aircraft: {
  manufacturer: string;
  model: string;
  suffix?: string;
  addon?: string;
  flightsim?: string;
}): string {
  const addon = addonPrefix(aircraft);
  const full = formatAircraftName(aircraft);
  const model = formatModelName(aircraft);
  const sim = aircraft.flightsim ? ` for ${aircraft.flightsim}` : '';
  const candidates = [
    `${addon}${full} Checklist${sim} – Startup to Shutdown`,
    `${addon}${full} Checklist${sim}`,
    `${addon}${model} Checklist${sim}`,
    // Shorter forms that still name the sim people search with ("MSFS").
    ...(aircraft.flightsim
      ? [`${addon}${model} ${aircraft.flightsim} Checklist`, `${model} Checklist${sim}`]
      : []),
    `${addon}${model} Checklist`,
    `${model} Checklist`,
  ];
  return (
    candidates.find((title) => title.length <= TITLE_BUDGET) ?? candidates[candidates.length - 1]
  );
}

/** A phase title inside a sentence: "Shutdown & Secure" → "shutdown", "Cockpit Preparation" → "cockpit preparation". */
const phaseInSentence = (title: string) => title.split('&')[0].trim().toLowerCase();

/**
 * The checklist page's meta description: what the page is, for search results and link
 * previews, e.g. "Interactive checklist for the PMDG Boeing 737NG in MSFS: 213 items in
 * 12 phases, from cockpit preparation to shutdown and secure, in full, normal or quick mode."
 * Built from the checklist itself, so it stays true when a checklist changes. The line about
 * the real aircraft (`description`) stays on the page.
 */
export function checklistMetaDescription(aircraft: {
  manufacturer: string;
  model: string;
  suffix?: string;
  addon?: string;
  flightsim?: string;
  checklist: ChecklistPhase[];
}): string {
  const phases = aircraft.checklist;
  const name = `${addonPrefix(aircraft)}${formatAircraftName(aircraft)}`;
  const sim = aircraft.flightsim ? ` in ${aircraft.flightsim}` : '';
  const full = countItems(phases);
  const normal = countItems(filterChecklist(phases, 'normal'));
  const quick = countItems(filterChecklist(phases, 'quick'));
  // Name only the modes that show something different.
  const modes = ['full'];
  if (normal > 0 && normal < full && normal !== quick) modes.push('normal');
  if (quick > 0 && quick < full) modes.push('quick');
  const modeText =
    modes.length > 1
      ? `, in ${modes.slice(0, -1).join(', ')} or ${modes[modes.length - 1]} mode`
      : '';
  const span =
    phases.length > 1
      ? `, from ${phaseInSentence(phases[0].title)} to ${phaseInSentence(phases[phases.length - 1].title)}`
      : '';
  const shortName = `${addonPrefix(aircraft)}${formatModelName(aircraft)}`;
  const size = `${full} items in ${phases.length} phases`;
  // The longest form that fits a search result (160 characters).
  const candidates = [
    `Interactive checklist for the ${name}${sim}: ${size}${span}${modeText}.`,
    `Interactive checklist for the ${shortName}${sim}: ${size}${span}${modeText}.`,
    `Checklist for the ${shortName}${sim}: ${size}${span}${modeText}.`,
    `Checklist for the ${shortName}${sim}: ${size}${modeText}.`,
  ];
  return candidates.find((d) => d.length <= 160) ?? candidates[candidates.length - 1];
}
