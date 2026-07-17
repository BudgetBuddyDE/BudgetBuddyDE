import {describe, expect, it} from 'vitest';
import {mapCsvRows, parseCsv} from './csv-import';

describe('CSV import model', () => {
  it('parses quoted delimiters, escaped quotes, CRLF, and BOM', () => {
    const result = parseCsv('\uFEFFdate,amount,receiver\r\n2026-07-01,-12.50,"Market, \"\"Central\"\""\r\n');
    expect(result.headers).toEqual(['date', 'amount', 'receiver']);
    expect(result.rows[0]).toEqual(['2026-07-01', '-12.50', 'Market, "Central"']);
  });
  it('previews valid and invalid rows independently with mapping confirmation', () => {
    const document = parseCsv('date,amount,receiver,type\n2026-07-01,12.50,Market,expense\nbad,nope,,income');
    const result = mapCsvRows(
      document,
      {date: 'date', amount: 'amount', receiver: 'receiver', type: 'type'},
      {categoryId: 'c', paymentMethodId: 'p'},
    );
    expect(result[0]?.draft).toMatchObject({amount: '12.50', type: 'expense', receiver: 'Market'});
    expect(result[1]?.errors).toEqual(expect.arrayContaining(['Invalid date', 'Invalid amount', 'Missing receiver']));
  });
});
