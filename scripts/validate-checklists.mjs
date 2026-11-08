/**
 * validate-checklists.mjs
 *
 * Structural validation for the checklist JSON in content/checklists/.
 * Contributors add and edit checklists freely, so this script checks shape
 * and consistency rather than fixed item totals.
 *
 * Checks:
 *   - every file parses and its slug matches its filename
 *   - slugs are URL-safe and unique
 *   - required aircraft, phase, group and item fields are present and non-empty
 *   - enum fields (status, systemsType, tier) use known values
 *   - every aircraft has at least one phase, every phase a group, every group an item
 *   - phase ids are kebab-case and unique within the aircraft; item ids are
 *     kebab-case and unique within their phase (they key saved progress)
 *   - content/aircraft-index.json (if generated) matches the detail files
 *
 * Usage: node scripts/validate-checklists.mjs
 * Exit 0 on pass, exit 1 on any failure.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INDEX_PATH = resolve(ROOT, 'content/aircraft-index.json');
const DETAIL_DIR = resolve(ROOT, 'content/checklists');

// Keep in sync with src/types.ts.
const REQUIRED_AIRCRAFT_STRINGS = ['slug', 'model', 'manufacturer', 'description', 'systemsType'];
const OPTIONAL_AIRCRAFT_STRINGS = ['suffix', 'addon', 'flightsim', 'simDepth', 'variant'];
const VALID_STATUS = new Set(['active', 'draft', 'coming-soon']);
const VALID_SYSTEMS_TYPE = new Set(['airliner', 'business-jet', 'turboprop', 'piston', 'military']);
const VALID_TIERS = new Set(['quick', 'normal', 'full']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Same as ID_PATTERN in src/utils/ids.ts.
const ID_PATTERN = SLUG_PATTERN;

const errors = [];

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

function requireString(obj, field, path) {
  if (!isNonEmptyString(obj[field])) {
    errors.push(`${path}: "${field}" must be a non-empty string`);
  }
}

function optionalString(obj, field, path) {
  if (obj[field] !== undefined && typeof obj[field] !== 'string') {
    errors.push(`${path}: "${field}" must be a string when present`);
  }
}

function validateItem(item, path) {
  if (typeof item !== 'object' || item === null) {
    errors.push(`${path}: item must be an object`);
    return;
  }
  requireString(item, 'label', path);
  requireString(item, 'action', path);
  optionalString(item, 'info', path);
  requireId(item, path);
  if (item.tier !== undefined && !VALID_TIERS.has(item.tier)) {
    errors.push(`${path}: invalid tier "${item.tier}" (expected ${[...VALID_TIERS].join(', ')})`);
  }
}

/** Ids key saved progress, so they must be present, kebab-case and unique in their scope. */
function requireId(obj, path) {
  if (typeof obj.id !== 'string' || !ID_PATTERN.test(obj.id)) {
    errors.push(
      `${path}: "id" must be lowercase kebab-case (got ${JSON.stringify(obj.id)}). See docs/checklist-guide.md#ids`,
    );
    return false;
  }
  return true;
}

function checkUnique(seen, id, path, scope) {
  if (seen.has(id)) {
    errors.push(
      `${path}: id "${id}" is already used by ${seen.get(id)} (ids must be unique within ${scope})`,
    );
  } else {
    seen.set(id, path);
  }
}

function validateGroup(group, path, phaseItemIds) {
  requireString(group, 'title', path);
  if (!Array.isArray(group.items) || group.items.length === 0) {
    errors.push(`${path}: "items" must be a non-empty array`);
    return 0;
  }
  group.items.forEach((item, i) => {
    const itemPath = `${path}.items[${i}]`;
    validateItem(item, itemPath);
    if (typeof item === 'object' && item !== null && ID_PATTERN.test(item.id ?? '')) {
      checkUnique(phaseItemIds, item.id, itemPath, 'the phase');
    }
  });
  return group.items.length;
}

function validatePhase(phase, path) {
  requireString(phase, 'title', path);
  requireId(phase, path);
  if (!Array.isArray(phase.groups) || phase.groups.length === 0) {
    errors.push(`${path}: "groups" must be a non-empty array`);
    return { groups: 0, items: 0 };
  }
  const itemIds = new Map();
  let items = 0;
  phase.groups.forEach((group, i) => {
    items += validateGroup(group, `${path}.groups[${i}]`, itemIds);
  });
  return { groups: phase.groups.length, items };
}

function validateAircraft(data, file) {
  const path = file;
  REQUIRED_AIRCRAFT_STRINGS.forEach((f) => requireString(data, f, path));
  OPTIONAL_AIRCRAFT_STRINGS.forEach((f) => optionalString(data, f, path));

  const expectedSlug = basename(file, '.json');
  if (data.slug !== expectedSlug) {
    errors.push(`${path}: slug "${data.slug}" must match the filename "${expectedSlug}"`);
  }
  if (isNonEmptyString(data.slug) && !SLUG_PATTERN.test(data.slug)) {
    errors.push(
      `${path}: slug "${data.slug}" must be lowercase letters, digits and single hyphens`,
    );
  }
  if (data.status !== undefined && !VALID_STATUS.has(data.status)) {
    errors.push(
      `${path}: invalid status "${data.status}" (expected ${[...VALID_STATUS].join(', ')})`,
    );
  }
  if (data.systemsType !== undefined && !VALID_SYSTEMS_TYPE.has(data.systemsType)) {
    errors.push(
      `${path}: invalid systemsType "${data.systemsType}" (expected ${[...VALID_SYSTEMS_TYPE].join(', ')})`,
    );
  }
  if (data.isNew !== undefined && typeof data.isNew !== 'boolean') {
    errors.push(`${path}: "isNew" must be a boolean when present`);
  }

  const totals = { phases: 0, groups: 0, items: 0 };
  if (!Array.isArray(data.checklist) || data.checklist.length === 0) {
    errors.push(`${path}: "checklist" must be a non-empty array of phases`);
    return totals;
  }
  const phaseIds = new Map();
  data.checklist.forEach((phase, i) => {
    const phasePath = `${path}.checklist[${i}]`;
    if (typeof phase === 'object' && phase !== null && ID_PATTERN.test(phase.id ?? '')) {
      checkUnique(phaseIds, phase.id, phasePath, 'the aircraft');
    }
    const t = validatePhase(phase, phasePath);
    totals.groups += t.groups;
    totals.items += t.items;
  });
  totals.phases = data.checklist.length;
  return totals;
}

// ─── Detail files ───────────────────────────────────────────────────────────
const detailFiles = readdirSync(DETAIL_DIR).filter((f) => f.endsWith('.json'));
if (detailFiles.length === 0) {
  errors.push(`No checklist files found in ${DETAIL_DIR}`);
}

const detailBySlug = new Map();
const grand = { aircraft: 0, phases: 0, groups: 0, items: 0 };

for (const file of detailFiles) {
  let data;
  try {
    data = JSON.parse(readFileSync(resolve(DETAIL_DIR, file), 'utf-8'));
  } catch (e) {
    errors.push(`${file}: invalid JSON (${e.message})`);
    continue;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push(`${file}: top level must be an object`);
    continue;
  }
  if (detailBySlug.has(data.slug)) {
    errors.push(`${file}: duplicate slug "${data.slug}"`);
  }
  detailBySlug.set(data.slug, data);

  const t = validateAircraft(data, file);
  grand.aircraft++;
  grand.phases += t.phases;
  grand.groups += t.groups;
  grand.items += t.items;
}

// ─── Index consistency (only when the generated index exists) ───────────────
if (existsSync(INDEX_PATH)) {
  let index;
  try {
    index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  } catch (e) {
    errors.push(`aircraft-index.json: invalid JSON (${e.message})`);
  }
  if (Array.isArray(index)) {
    const indexSlugs = new Set(index.map((e) => e.slug));
    for (const entry of index) {
      const detail = detailBySlug.get(entry.slug);
      if (!detail) {
        errors.push(`aircraft-index.json: "${entry.slug}" has no checklist file`);
      } else if (
        Array.isArray(detail.checklist) &&
        entry.checklistCount !== detail.checklist.length
      ) {
        errors.push(
          `aircraft-index.json: "${entry.slug}" checklistCount=${entry.checklistCount} but file has ${detail.checklist.length} phases`,
        );
      }
    }
    for (const slug of detailBySlug.keys()) {
      if (!indexSlugs.has(slug)) errors.push(`aircraft-index.json: missing "${slug}"`);
    }
    if (errors.some((e) => e.startsWith('aircraft-index.json'))) {
      errors.push('aircraft-index.json is stale; run `npm run index:generate`');
    }
  } else if (index !== undefined) {
    errors.push('aircraft-index.json: top level must be an array');
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`\nVALIDATION FAILED — ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  FAIL  ${e}`);
  console.error('');
  process.exit(1);
}

console.log('VALIDATION PASSED');
console.log(
  `  aircraft=${grand.aircraft} phases=${grand.phases} groups=${grand.groups} items=${grand.items}`,
);
