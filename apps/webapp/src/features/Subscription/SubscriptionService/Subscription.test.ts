import {type TSubscription} from '@budgetbuddyde/types';

import {SubscriptionService} from './Subscription.service';

describe('getPlannedBalanceByType', () => {
  it('should return an empty array when subscriptions is empty', () => {
    const subscriptions: TSubscription[] = [];
    const result = SubscriptionService.getPlannedBalanceByType(subscriptions);
    expect(result).toEqual([]);
  });

  it('should return an array of income subscriptions when type is "INCOME"', () => {
    const subscriptions = [
      {transfer_amount: 100, execute_at: new Date().getDate()},
      {transfer_amount: -50, execute_at: new Date().getDate()},
      {transfer_amount: 200, execute_at: new Date().getDate()},
    ] as TSubscription[];
    const result = SubscriptionService.getPlannedBalanceByType(subscriptions, 'INCOME');
    expect(result).toEqual([
      {transfer_amount: 100, execute_at: new Date().getDate()},
      {transfer_amount: 200, execute_at: new Date().getDate()},
    ]);
  });

  it('should return an array of spending subscriptions when type is "SPENDINGS"', () => {
    const subscriptions = [
      {transfer_amount: 100, execute_at: new Date().getDate()},
      {transfer_amount: -50, execute_at: new Date().getDate()},
      {transfer_amount: 200, execute_at: new Date().getDate()},
    ] as TSubscription[];
    const result = SubscriptionService.getPlannedBalanceByType(subscriptions, 'SPENDINGS');
    expect(result).toEqual([{transfer_amount: -50, execute_at: new Date().getDate()}]);
  });
});

describe('getUpcomingX', () => {
  it('should return the sum of upcoming income subscriptions', () => {
    const subscriptions = [
      {transfer_amount: 100, execute_at: new Date().getDate() + 1},
      {transfer_amount: -50, execute_at: new Date().getDate()},
      {transfer_amount: 200, execute_at: new Date().getDate()},
    ] as TSubscription[];
    const result = SubscriptionService.getUpcomingX('INCOME', subscriptions);
    expect(result).toEqual(100);
  });

  it('should return the sum of upcoming spending subscriptions', () => {
    const subscriptions = [
      {transfer_amount: 100, execute_at: new Date().getDate() + 1},
      {transfer_amount: -50, execute_at: new Date().getDate() + 1},
      {transfer_amount: 200, execute_at: new Date().getDate()},
      {transfer_amount: -25, execute_at: new Date().getDate()},
    ] as TSubscription[];
    const result = SubscriptionService.getUpcomingX('EXPENSES', subscriptions);
    expect(result).toEqual(50);
  });
});
