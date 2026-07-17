import {describe, expect, it} from 'vitest';
import {createImportPreview, createTransactionImportPreview, parseCsv} from './csv';
import {serializeRecordsCsv} from './export';

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
    expect(preview[1]?.errors).toEqual(expect.arrayContaining(['Invalid date', 'Invalid amount', 'Missing receiver']));
  });

  it('imports a transaction exported with BudgetBuddy field names', () => {
    const csv = serializeRecordsCsv([
      {
        id: 'tx-1',
        processedAt: new Date('2026-07-15T00:00:00.000Z'),
        receiver: 'Market',
        transferAmount: -42.5,
        information: 'Weekly shop',
        categoryId: 'cat-1',
        categoryName: 'Groceries',
        paymentMethodId: 'pay-1',
        paymentMethodName: 'Visa',
      },
    ]);
    const preview = createTransactionImportPreview(csv, categories, paymentMethods);
    expect(preview).toHaveLength(1);
    expect(preview[0]?.input).toMatchObject({
      processedAt: new Date('2026-07-15T00:00:00.000Z'),
      transferAmount: -42.5,
      categoryId: 'cat-1',
      paymentMethodId: 'pay-1',
    });
  });

  it('imports categories, payment methods, and recurring payments', () => {
    const categoryPreview = createImportPreview('name,description\nRent,Monthly housing', categories, paymentMethods);
    const methodPreview = createImportPreview(
      'name,provider,address,description\nDebit,Bank,1234,Main account',
      categories,
      paymentMethods,
    );
    const recurringPreview = createImportPreview(
      'executeAt,interval,paused,receiver,transferAmount,categoryName,paymentMethodName,information\n1,monthly,false,Rent,-900,Groceries,Visa,Monthly rent',
      categories,
      paymentMethods,
    );
    expect(categoryPreview[0]?.input).toEqual({name: 'Rent', description: 'Monthly housing'});
    expect(methodPreview[0]?.input).toEqual({
      name: 'Debit',
      provider: 'Bank',
      address: '1234',
      description: 'Main account',
    });
    expect(recurringPreview[0]?.input).toMatchObject({
      executeAt: 1,
      interval: 'monthly',
      paused: false,
      transferAmount: -900,
      categoryId: 'cat-1',
      paymentMethodId: 'pay-1',
    });
  });
});
