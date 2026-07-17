import {describe, expect, it} from 'vitest';
import {serializeRecordsCsv} from './export';

describe('record exports', () => {
  it('serializes selected records as escaped CSV', () => {
    expect(
      serializeRecordsCsv([
        {id: 'tx-1', receiver: 'Market, Central', processedAt: new Date('2026-07-15T00:00:00.000Z')},
      ]),
    ).toBe('"id","receiver","processedAt"\n"tx-1","Market, Central","2026-07-15T00:00:00.000Z"');
  });
});
