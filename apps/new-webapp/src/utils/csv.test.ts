import {describe, expect, it} from 'vitest';
import {createTransactionImportPreview, parseCsv} from './csv';

const categories = [{id: 'cat-1', name: 'Groceries', description: null}];
const paymentMethods = [{id: 'pay-1', name: 'Visa', provider: 'Bank', address: '4242', description: null}];

describe('CSV transaction import', () => {
  it('parses quoted commas and escaped quotes without losing columns', () => {
    expect(parseCsv('receiver,note\n"Corner, Shop","Say ""hello"""')).toEqual([
      ['receiver', 'note'],
      ['Corner, Shop', 'Say "hello"'],
    ]);
  });

  it('keeps valid rows importable while reporting invalid rows separately', () => {
    const preview = createTransactionImportPreview(
      'date,amount,receiver,category,paymentMethod,note\n2026-07-15,-42.50,Market,Groceries,Visa,Weekly shop\ninvalid,0,,Unknown,Missing,',
      categories,
      paymentMethods,
    );
    expect(preview[0]?.input).toMatchObject({transferAmount: -42.5, categoryId: 'cat-1', paymentMethodId: 'pay-1'});
    expect(preview[1]?.input).toBeNull();
    expect(preview[1]?.errors).toEqual(
      expect.arrayContaining(['csv.invalidDate', 'csv.invalidAmount', 'csv.missingReceiver']),
    );
  });
});
