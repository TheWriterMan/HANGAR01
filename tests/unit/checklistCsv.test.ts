import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import {
  convertCsvRows,
  CSV_LIMITS,
  decodeCsvBytes,
  LEGACY_ENCODING_WARNING,
  nameFromFileName,
  parseChecklistCsv,
} from '../../src/utils/checklistCsv';
import { ID_PATTERN } from '../../src/utils/ids';
import type { ChecklistPhase } from '../../src/types';

const parse = (text: string) => parseChecklistCsv(text, Papa);
const csv = (...lines: string[]) => lines.join('\n') + '\n';
const items = (checklist: ChecklistPhase[]) =>
  checklist.flatMap((p) => p.groups.flatMap((g) => g.items.map((i) => ({ phase: p.id, ...i }))));

describe('the sample CSV', () => {
  const text = readFileSync(
    resolve(__dirname, '../../public/samples/hangar01-sample-checklist.csv'),
    'utf8',
  );
  const result = parse(text);

  it('imports with no errors or warnings', () => {
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('keeps phases and groups in order of first appearance', () => {
    expect(result.checklist.map((p) => p.title)).toEqual([
      'Preflight',
      'Before Start',
      'Engine Start',
      'Taxi',
      'Before Takeoff',
      'Shutdown',
    ]);
    expect(result.checklist[0].groups.map((g) => g.title)).toEqual(['Cabin', 'Exterior']);
    // A blank group takes the phase's name.
    expect(result.checklist[1].groups.map((g) => g.title)).toEqual(['Before Start']);
    expect(result.itemCount).toBe(33);
    expect(result.groupCount).toBe(8);
  });

  it('gives every item a kebab-case id, unique within its phase', () => {
    for (const phase of result.checklist) {
      const ids = phase.groups.flatMap((g) => g.items.map((i) => i.id));
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(ID_PATTERN);
    }
    // "Battery master" twice in Preflight: the second is suffixed.
    const preflight = result.checklist[0].groups[0].items.map((i) => i.id);
    expect(preflight).toContain('battery-master');
    expect(preflight).toContain('battery-master-2');
  });

  it('keeps quoted commas and the info text', () => {
    const flaps = items(result.checklist).find(
      (i) => i.label === 'Flaps' && i.phase === 'preflight',
    );
    expect(flaps?.action).toBe('EXTEND, CHECK');
    expect(flaps?.info).toBe('Lower fully, check both sides visually, then retract.');
    expect(items(result.checklist)[0]).not.toHaveProperty('info');
  });
});

describe('required columns', () => {
  it('reports each missing required column on row 1 and builds nothing', () => {
    const result = parse(csv('Phase,Group,Label', 'Preflight,,Battery'));
    expect(result.errors).toEqual([
      { row: 1, message: 'The required column "action" is missing.' },
    ]);
    expect(result.checklist).toEqual([]);
  });

  it('matches column names case-insensitively and trimmed, in any order', () => {
    const result = parse(csv(' ACTION ,Label,  phase', 'ON,Battery,Preflight'));
    expect(result.errors).toEqual([]);
    expect(items(result.checklist)[0]).toMatchObject({ label: 'Battery', action: 'ON' });
  });

  it('flags empty phase, label or action by row', () => {
    const result = parse(
      csv('phase,label,action', 'Preflight,Battery,ON', ',Beacon,ON', 'Taxi,,ON', 'Taxi,Lights,'),
    );
    expect(result.errors).toEqual([
      { row: 3, message: 'Phase is empty.' },
      { row: 4, message: 'Label is empty.' },
      { row: 5, message: 'Action is empty.' },
    ]);
  });

  it('warns about unknown and repeated columns', () => {
    const result = parse(csv('phase,label,action,notes,label', 'Preflight,Battery,ON,x,y'));
    expect(result.errors).toEqual([]);
    expect(result.warnings.map((w) => w.message)).toEqual([
      'Unknown column "notes" is ignored.',
      'The column "label" appears twice. Only the first one is used.',
    ]);
    expect(items(result.checklist)[0].label).toBe('Battery');
  });

  it('reads a semicolon or tab file and a UTF-8 BOM', () => {
    expect(parse('﻿phase;label;action\nPreflight;Battery;ON\n').errors).toEqual([]);
    const pasted = parse('phase\tlabel\taction\nPreflight\tBattery\tON');
    expect(pasted.errors).toEqual([]);
    expect(pasted.itemCount).toBe(1);
  });

  it('errors on a quote mark that is never closed', () => {
    const result = parse(csv('phase,label,action', 'Preflight,"Battery,ON', 'Taxi,Lights,ON'));
    expect(result.errors[0]).toEqual({
      row: 2,
      message: "A quote mark isn't closed, so the rows after it run together.",
    });
  });

  it('errors on an empty file or a header with no rows', () => {
    expect(parse('').errors).toEqual([{ row: null, message: 'The file is empty.' }]);
    expect(parse('\n\n').errors).toEqual([{ row: null, message: 'The file is empty.' }]);
    expect(parse(csv('phase,label,action')).errors).toEqual([
      { row: null, message: 'The file has no checklist rows.' },
    ]);
  });
});

describe('tiers', () => {
  it('defaults to quick when the column is missing or blank', () => {
    const missing = parse(csv('phase,label,action', 'Preflight,Battery,ON'));
    expect(items(missing.checklist)[0].tier).toBe('quick');
    const blank = parse(csv('phase,label,action,tier', 'Preflight,Battery,ON,'));
    expect(items(blank.checklist)[0].tier).toBe('quick');
    expect(blank.warnings).toEqual([]);
  });

  it('accepts quick, normal and full in any case', () => {
    const result = parse(
      csv('phase,label,action,tier', 'P,A,ON,Quick', 'P,B,ON, NORMAL ', 'P,C,ON,full'),
    );
    expect(items(result.checklist).map((i) => i.tier)).toEqual(['quick', 'normal', 'full']);
  });

  it('turns an invalid tier into quick with a warning on its row', () => {
    const result = parse(csv('phase,label,action,tier', 'P,A,ON,study'));
    expect(items(result.checklist)[0].tier).toBe('quick');
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      { row: 2, message: 'Tier "study" isn\'t quick, normal or full, so it\'s set to quick.' },
    ]);
  });
});

describe('ids', () => {
  it('generates kebab-case ids from labels and phase titles', () => {
    const result = parse(
      csv('phase,label,action', 'Before Start,Bat & Alt Master,ON', 'Before Start,Café 2,ON'),
    );
    expect(result.checklist[0].id).toBe('before-start');
    expect(items(result.checklist).map((i) => i.id)).toEqual(['bat-alt-master', 'cafe-2']);
  });

  it('suffixes repeated labels within a phase, but not across phases', () => {
    const result = parse(
      csv(
        'phase,label,action',
        'Preflight,Flaps,UP',
        'Preflight,Flaps,DOWN',
        'Preflight,Flaps,UP',
        'Taxi,Flaps,SET',
      ),
    );
    expect(items(result.checklist).map((i) => `${i.phase}/${i.id}`)).toEqual([
      'preflight/flaps',
      'preflight/flaps-2',
      'preflight/flaps-3',
      'taxi/flaps',
    ]);
    expect(result.warnings).toEqual([]);
  });

  it('keeps ids written in the file, ahead of generated ones', () => {
    // Row 2's label would generate "flaps", but row 3 claims it explicitly.
    const result = parse(csv('phase,label,action,id', 'P,Flaps,UP,', 'P,Flap lever,DOWN,flaps'));
    expect(items(result.checklist).map((i) => i.id)).toEqual(['flaps-2', 'flaps']);
    expect(result.warnings).toEqual([]);
  });

  it('suffixes a repeated written id with a warning, skipping ids already taken', () => {
    const result = parse(
      csv('phase,label,action,id', 'P,A,ON,flaps', 'P,B,ON,flaps-2', 'P,C,ON,flaps'),
    );
    expect(items(result.checklist).map((i) => i.id)).toEqual(['flaps', 'flaps-2', 'flaps-3']);
    expect(result.warnings).toEqual([
      { row: 4, message: 'Id "flaps" is already used in this phase, so it\'s "flaps-3".' },
    ]);
  });

  it('converts a written id that is not kebab-case, with a warning', () => {
    const result = parse(csv('phase,label,action,id', 'P,A,ON,Battery Master'));
    expect(items(result.checklist)[0].id).toBe('battery-master');
    expect(result.warnings).toEqual([
      { row: 2, message: 'Id "Battery Master" isn\'t kebab-case, so it\'s "battery-master".' },
    ]);
  });

  it('suffixes phase ids when two phase names make the same id', () => {
    const result = parse(csv('phase,label,action', 'Before Start,A,ON', 'Before-Start,B,ON'));
    expect(result.checklist.map((p) => p.id)).toEqual(['before-start', 'before-start-2']);
  });
});

describe('order and merging', () => {
  it('merges a phase that appears again later, with one warning where it reappears', () => {
    const result = parse(
      csv('phase,label,action', 'Taxi,A,ON', 'Takeoff,B,ON', 'Taxi,C,ON', 'Taxi,D,ON'),
    );
    expect(result.checklist.map((p) => p.title)).toEqual(['Taxi', 'Takeoff']);
    expect(result.checklist[0].groups[0].items.map((i) => i.label)).toEqual(['A', 'C', 'D']);
    expect(result.warnings).toEqual([
      {
        row: 4,
        message: 'Phase "Taxi" also appears earlier. This row and the ones after it join it there.',
      },
    ]);
  });
});

describe('blank rows', () => {
  it('skips blank rows in the middle with a warning, and trailing ones silently', () => {
    const result = parse('phase,label,action\nP,A,ON\n\n,,\nP,B,ON\n\n,,\n\n');
    expect(result.errors).toEqual([]);
    expect(result.itemCount).toBe(2);
    expect(result.warnings).toEqual([
      { row: 3, message: 'Blank row skipped.' },
      { row: 4, message: 'Blank row skipped.' },
    ]);
  });

  it('counts a cell with a line break as one row', () => {
    const result = parse('phase,label,action,info\nP,A,ON,"line one\nline two"\nP,,ON\n');
    expect(result.errors).toEqual([{ row: 3, message: 'Label is empty.' }]);
  });
});

describe('limits', () => {
  it('errors on a file over 500 KB', () => {
    const text = 'phase,label,action,info\n' + 'P,A,ON,'.padEnd(CSV_LIMITS.fileBytes, 'x');
    expect(parse(text).errors).toEqual([{ row: null, message: 'The file is over 500 KB.' }]);
  });

  it('allows 1,000 rows and errors on 1,001', () => {
    const rows = (n: number) =>
      ['phase,label,action', ...Array.from({ length: n }, (_, i) => `P,Item ${i},ON`)].join('\n');
    expect(parse(rows(1000)).errors).toEqual([]);
    expect(parse(rows(1001)).errors).toEqual([
      { row: null, message: 'The file has 1,001 rows. The limit is 1,000.' },
    ]);
  });

  it('errors on label, action and info over their limits, and accepts them at the limit', () => {
    const at = parse(
      csv('phase,label,action,info', `P,${'a'.repeat(120)},${'b'.repeat(120)},${'c'.repeat(500)}`),
    );
    expect(at.errors).toEqual([]);
    const over = parse(
      csv('phase,label,action,info', `P,${'a'.repeat(121)},${'b'.repeat(121)},${'c'.repeat(501)}`),
    );
    expect(over.errors).toEqual([
      { row: 2, message: 'Label is over 120 characters.' },
      { row: 2, message: 'Action is over 120 characters.' },
      { row: 2, message: 'Info is over 500 characters.' },
    ]);
  });
});

describe('convertCsvRows', () => {
  it('keeps text as plain strings, markup and all', () => {
    const result = convertCsvRows([
      ['phase', 'label', 'action'],
      ['<b>P</b>', '<img src=x onerror=alert(1)>', '=1+1'],
    ]);
    expect(items(result.checklist)[0]).toMatchObject({
      label: '<img src=x onerror=alert(1)>',
      action: '=1+1',
    });
    expect(result.checklist[0].title).toBe('<b>P</b>');
  });
});

describe('nameFromFileName', () => {
  it('drops the extension and underscores', () => {
    expect(nameFromFileName('My_C172 checklist.csv')).toBe('My C172 checklist');
    expect(nameFromFileName('a320-200.tsv')).toBe('a320-200');
  });
});

describe('file encoding', () => {
  // "Flaps 10°" and "Café" as Excel's plain "CSV (Comma delimited)" writes them on
  // Windows: Windows-1252, where ° is 0xB0 and é is 0xE9, neither valid UTF-8.
  const latin1 = (text: string) => Uint8Array.from([...text].map((c) => c.charCodeAt(0)));
  const csv1252 = latin1('phase,label,action\nCafé,Flaps 10°,SET\n');

  it('reads a Windows-1252 file as Windows-1252, with a warning', () => {
    const { text, legacyEncoding } = decodeCsvBytes(csv1252);
    expect(legacyEncoding).toBe(true);
    const result = parseChecklistCsv(text, Papa, { legacyEncoding });
    expect(result.errors).toEqual([]);
    expect(result.checklist[0].title).toBe('Café');
    expect(result.checklist[0].groups[0].items[0].label).toBe('Flaps 10°');
    expect(result.warnings).toEqual([{ row: null, message: LEGACY_ENCODING_WARNING }]);
  });

  it('reads UTF-8, with or without a BOM, with no warning', () => {
    const utf8 = new TextEncoder().encode('﻿phase,label,action\nCafé,Flaps 10°,SET\n');
    const { text, legacyEncoding } = decodeCsvBytes(utf8);
    expect(legacyEncoding).toBe(false);
    const result = parseChecklistCsv(text, Papa, { legacyEncoding });
    expect(result.warnings).toEqual([]);
    expect(result.checklist[0].groups[0].items[0].label).toBe('Flaps 10°');
  });
});

describe('phase and group names', () => {
  it('cuts names over 80 characters, warning once per name', () => {
    const long = 'P'.repeat(90);
    const group = 'G'.repeat(81);
    const result = parse(
      csv('phase,group,label,action', `${long},${group},A,ON`, `${long},${group},B,ON`),
    );
    expect(result.errors).toEqual([]);
    expect(result.checklist[0].title).toBe('P'.repeat(80));
    expect(result.checklist[0].groups[0].title).toBe('G'.repeat(80));
    expect(result.itemCount).toBe(2);
    expect(result.warnings).toEqual([
      { row: 2, message: "Phase name is over 80 characters, so it's cut to 80." },
      { row: 2, message: "Group name is over 80 characters, so it's cut to 80." },
    ]);
  });
});
