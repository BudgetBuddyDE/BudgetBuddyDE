import {type TTransaction} from '@budgetbuddyde/types';
import {addDays, subDays} from 'date-fns';

import {TransactionService} from './Transaction.service';

describe('getUniqueReceivers', () => {
  it('should return an empty array if transactions is empty', () => {
    const transactions: TTransaction[] = [];
    const result = TransactionService.getUniqueReceivers(transactions);
    expect(result).toEqual([]);
  });

  it('should return an array of unique receivers', () => {
    const transactions = [
      {receiver: 'John', processed_at: new Date()},
      {receiver: 'Jane', processed_at: new Date()},
      {receiver: 'John', processed_at: new Date()},
      {receiver: 'Alice', processed_at: new Date()},
    ] as TTransaction[];
    const result = TransactionService.getUniqueReceivers(transactions);
    expect(result).toEqual(['John', 'Jane', 'Alice']);
  });

  it('should return an array of unique receivers within the specified days', () => {
    const transactions = [
      {receiver: 'John', processed_at: subDays(new Date(), 10)},
      {receiver: 'Jane', processed_at: subDays(new Date(), 20)},
      {receiver: 'John', processed_at: subDays(new Date(), 5)},
      {receiver: 'Alice', processed_at: subDays(new Date(), 15)},
    ] as TTransaction[];
    const result = TransactionService.getUniqueReceivers(transactions, 15);
    expect(result).toEqual(['John', 'Alice', 'Jane']);
  });

  it('should return an array of unique receivers sorted by frequency', () => {
    const transactions = [
      {receiver: 'John', processed_at: new Date()},
      {receiver: 'Jane', processed_at: new Date()},
      {receiver: 'John', processed_at: new Date()},
      {receiver: 'Alice', processed_at: new Date()},
      {receiver: 'Alice', processed_at: new Date()},
      {receiver: 'Alice', processed_at: new Date()},
    ] as TTransaction[];
    const result = TransactionService.getUniqueReceivers(transactions);
    expect(result).toEqual(['Alice', 'John', 'Jane']);
  });
});

describe('getUpcomingX', () => {
  it('should return the sum of upcoming income transactions', () => {
    const transactions = [
      {receiver: 'John', processed_at: subDays(new Date(), 1), transfer_amount: 100},
      {receiver: 'Jane', processed_at: subDays(new Date(), 2), transfer_amount: 200},
      {receiver: 'John', processed_at: addDays(new Date(), 3), transfer_amount: -50},
      {receiver: 'Alice', processed_at: addDays(new Date(), 4), transfer_amount: 300},
    ] as TTransaction[];
    const result = TransactionService.getUpcomingX('INCOME', transactions);
    expect(result).toEqual(300);
  });

  it('should return the sum of upcoming expense transactions', () => {
    const transactions = [
      {receiver: 'John', processed_at: addDays(new Date(), 1), transfer_amount: 100},
      {receiver: 'Jane', processed_at: addDays(new Date(), 2), transfer_amount: -200},
      {receiver: 'John', processed_at: addDays(new Date(), 3), transfer_amount: -50},
      {receiver: 'Alice', processed_at: addDays(new Date(), 4), transfer_amount: -300},
    ] as TTransaction[];
    const result = TransactionService.getUpcomingX('EXPENSES', transactions);
    expect(result).toEqual(-550);
  });
});
