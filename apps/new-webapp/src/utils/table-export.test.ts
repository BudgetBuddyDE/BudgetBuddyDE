import {describe, expect, it} from 'vitest';
import {createCsv, createJson, exportFileName, type ExportColumn} from './table-export';

interface Row {
  id: string;
  note: string;
  internalSecret: string;
  amount: number;
}
const columns: ExportColumn<Row>[] = [
  {key: 'id', header: 'Identifier', value: row => row.id},
  {key: 'note', header: 'Note', value: row => row.note},
  {key: 'amount', header: 'Amount', value: row => row.amount},
];
const rows: Row[] = [{id: 'tx-1', note: 'Café, "Lunch"\nwith Alex', internalSecret: 'never-export', amount: -12.5}];

describe('table exports', () => {
  it('creates UTF-8 CSV with stable headers and escaped special characters', () => {
    const csv = createCsv(rows, columns);
    expect(csv.startsWith('\uFEFFIdentifier,Note,Amount\r\n')).toBe(true);
    expect(csv).toContain('"Café, ""Lunch""\nwith Alex"');
    expect(csv).not.toContain('never-export');
  });

  it('creates a stable JSON envelope from explicitly public columns', () => {
    const json = JSON.parse(createJson('transactions', rows, columns, new Date('2026-07-16T00:00:00Z')));
    expect(json).toEqual({
      version: 1,
      entity: 'transactions',
      exportedAt: '2026-07-16T00:00:00.000Z',
      records: [{id: 'tx-1', note: 'Café, "Lunch"\nwith Alex', amount: -12.5}],
    });
    expect(exportFileName('transactions', 'json', new Date('2026-07-16'))).toBe(
      'budgetbuddy-transactions-2026-07-16.json',
    );
  });
});
