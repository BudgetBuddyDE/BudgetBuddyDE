import {PocketBaseCollection} from '@budgetbuddyde/types';
import {describe, expect, it, vi} from 'vitest';

import {retrieveTransactionReportData} from '../core/retrieveTransactionReportData';
import {pb} from '../pocketbase';
import {TRANSACTIONS, USER} from './data';

vi.spyOn(pb.collection(PocketBaseCollection.TRANSACTION), 'getFullList').mockResolvedValue(TRANSACTIONS);

describe('retrieveTransactionReportData', () => {
  it('should process transactions correctly', async () => {
    const startDate = new Date('2024-07-08');
    const endDate = new Date('2024-07-14');

    const result = await retrieveTransactionReportData(USER, startDate, endDate);

    expect(result.user).toEqual(USER);
    expect(Number(result.income.toFixed(2))).toEqual(2670);
    expect(Number(result.spendings.toFixed(2))).toEqual(59.05);
    expect(Number(result.balance.toFixed(2))).toEqual(2610.95);
    expect(result.grouped).toEqual([
      {
        category: 'Hobby',
        income: 0,
        spendings: 18.87,
        balance: -18.87,
      },
      {
        category: 'Takeaway',
        income: 0,
        spendings: 33.5,
        balance: -33.5,
      },
      {
        category: 'Abonnement',
        income: 0,
        spendings: 3.68,
        balance: -3.68,
      },
      {
        category: 'Tech',
        income: 0,
        spendings: 3,
        balance: -3,
      },
      {
        category: 'Salary',
        income: 2670,
        spendings: 0,
        balance: 2670,
      },
    ]);
  });
});
