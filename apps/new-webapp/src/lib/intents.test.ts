import {describe, expect, it} from 'vitest';
import {CORE_INTENTS, filterIntents, objectEditIntents} from './intents';
import type {FinanceData} from '@/types/finance';

const data: FinanceData = {
  categories: [{id: 'cat-1', name: 'Groceries', description: null}],
  paymentMethods: [{id: 'pay-1', name: 'Everyday card', provider: 'Bank', address: '•• 4242', description: null}],
  transactions: [
    {
      id: 'tx-1',
      processedAt: new Date('2026-07-15'),
      receiver: 'Market',
      transferAmount: -42,
      information: null,
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      paymentMethodId: 'pay-1',
      paymentMethodName: 'Everyday card',
      attachmentCount: 0,
    },
  ],
  recurring: [
    {
      id: 'rec-1',
      executeAt: 20,
      interval: 'monthly',
      nextExecutionAt: new Date('2026-07-20'),
      paused: false,
      expiresAt: null,
      receiver: 'Landlord',
      transferAmount: -900,
      information: null,
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      paymentMethodId: 'pay-1',
      paymentMethodName: 'Everyday card',
    },
  ],
  budgets: [
    {
      id: 'budget-1',
      type: 'e',
      name: 'Food cap',
      description: null,
      budget: 500,
      balance: -100,
      categoryIds: ['cat-1'],
      categoryNames: ['Groceries'],
    },
  ],
};

describe('intent registry', () => {
  it('keeps page and create workflows in typed registry entries', () => {
    expect(CORE_INTENTS.find(intent => intent.id === 'create-transaction')).toMatchObject({
      kind: 'create',
      href: '/transactions?intent=create',
    });
    expect(CORE_INTENTS.find(intent => intent.id === 'create-attachment')).toMatchObject({
      kind: 'create',
      href: '/attachments?intent=upload',
    });
    expect(CORE_INTENTS.some(intent => intent.group === 'Reporting')).toBe(true);
  });

  it('creates stable edit intents for searchable objects', () => {
    const intents = objectEditIntents(data);
    expect(intents.find(intent => intent.id === 'edit-category-cat-1')).toMatchObject({
      kind: 'edit',
      entityId: 'cat-1',
    });
    expect(intents.find(intent => intent.id === 'edit-recurring-rec-1')).toMatchObject({
      kind: 'edit',
      entityId: 'rec-1',
    });
    expect(intents.find(intent => intent.id === 'edit-budget-budget-1')).toMatchObject({
      kind: 'edit',
      entityId: 'budget-1',
    });
    expect(filterIntents(intents, 'market')).toHaveLength(1);
    expect(filterIntents(intents, 'missing')).toHaveLength(0);
  });
});
