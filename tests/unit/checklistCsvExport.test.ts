import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { checklistToCsv, csvFileName, parseChecklistCsv } from '../../src/utils/checklistCsv';
import type { ChecklistPhase } from '../../src/types';

const parse = (text: string) => parseChecklistCsv(text, Papa);
const sample = parse(
  readFileSync(resolve(__dirname, '../../public/samples/hangar01-sample-checklist.csv'), 'utf8'),
).checklist;

describe('checklistToCsv', () => {
  it('round-trips: the downloaded CSV imports to the same checklist, ids and all', () => {
    const again = parse(checklistToCsv(sample));
    expect(again.errors).toEqual([]);
    expect(again.warnings).toEqual([]);
    expect(again.checklist).toEqual(sample);
  });

  it('writes the import header, a BOM, CRLF line ends, ids, and a blank group named like its phase', () => {
    const csv = checklistToCsv(sample);
    expect(csv.startsWith('﻿phase,group,label,action,tier,info,id\r\n')).toBe(true);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv).toContain(
      '\r\nBefore Start,,Seats and belts,ADJUSTED / SECURE,normal,,seats-and-belts\r\n',
    );
    expect(csv).toContain('Preflight,Cabin,Battery master,OFF,normal,,battery-master-2');
  });

  it('quotes commas, quotes and line breaks', () => {
    const csv = checklistToCsv([
      {
        id: 'p',
        title: 'P',
        groups: [
          {
            title: 'P',
            items: [
              { id: 'a', label: 'Say "hi"', action: 'ON, CHECK', info: 'one\ntwo', tier: 'quick' },
            ],
          },
        ],
      },
    ]);
    expect(csv).toContain('P,,"Say ""hi""","ON, CHECK",quick,"one\ntwo",a');
  });

  it("prefixes cells that start with =, +, - or @ with ', and import takes it off again", () => {
    const checklist: ChecklistPhase[] = [
      {
        id: 'phase',
        title: '=Phase',
        groups: [
          {
            title: '@Group',
            items: [
              { id: 'a', label: '+5 knots', action: '-10', info: '=HYPERLINK("x")', tier: 'full' },
              { id: 'b', label: "Don't", action: 'ON', tier: 'quick' },
            ],
          },
        ],
      },
    ];
    const csv = checklistToCsv(checklist);
    expect(csv).toContain(`'=Phase,'@Group,'+5 knots,'-10,full,"'=HYPERLINK(""x"")",a`);
    expect(csv).toContain(`'=Phase,'@Group,Don't,ON,quick,,b`);
    const again = parse(csv);
    expect(again.errors).toEqual([]);
    expect(again.checklist).toEqual(checklist);
  });
});

describe('csvFileName', () => {
  it('names the file after the checklist', () => {
    expect(csvFileName('Cessna 172 Skyhawk')).toBe('cessna-172-skyhawk.csv');
    expect(csvFileName('°°°')).toBe('checklist.csv');
  });
});
