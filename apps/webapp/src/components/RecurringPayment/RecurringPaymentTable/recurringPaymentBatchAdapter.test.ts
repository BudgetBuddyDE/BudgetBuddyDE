import type {TExpandedRecurringPayment, TRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {describe, expect, it} from 'vitest';
import {columns, createEmptyRow, fromEntity, mapRowsToPayload} from './recurringPaymentBatchAdapter';

const categoryId = '00000000-0000-4000-8000-000000000021' as TRecurringPayment['categoryId'];
const paymentMethodId = '00000000-0000-4000-8000-000000000022' as TRecurringPayment['paymentMethodId'];

describe('recurring payment batch adapter', () => {
  it('creates a monthly draft starting today and preserves recurrence in payloads', () => {
    const row = createEmptyRow();
    expect(row.executionPlan).toBe('monthly');
    expect(row.startsOn).toBeInstanceOf(Date);
    expect(row.paused).toBe(false);

    const result = mapRowsToPayload([
      {
        ...row,
        executionPlan: 'biweekly',
        startsOn: new Date(2026, 7, 31),
        paused: true,
        categoryId,
        paymentMethodId,
        receiver: 'Rent',
        transferAmount: 900,
        information: '',
      },
    ]);
    expect(result).toEqual({
      success: true,
      payload: [
        {
          executionPlan: 'biweekly',
          startsOn: '2026-08-31',
          paused: true,
          categoryId,
          paymentMethodId,
          receiver: 'Rent',
          transferAmount: 900,
          information: null,
        },
      ],
    });
  });

  it('maps expanded rows and rejects invalid dates', () => {
    const entity = {
      id: '00000000-0000-4000-8000-000000000020',
      ownerId: 'owner',
      executionPlan: 'weekly',
      startsOn: '2026-08-15',
      paused: true,
      receiver: 'Rent',
      transferAmount: 900,
      information: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: {id: categoryId, ownerId: 'owner', name: 'Housing', description: null, createdAt: '', updatedAt: ''},
      paymentMethod: {
        id: paymentMethodId,
        ownerId: 'owner',
        name: 'Checking',
        provider: 'Bank',
        address: 'IBAN',
        description: null,
        createdAt: '',
        updatedAt: '',
      },
    } as unknown as TExpandedRecurringPayment;
    expect(fromEntity(entity)).toMatchObject({id: entity.id, executionPlan: 'weekly', paused: true});
    expect(fromEntity(entity).startsOn).toEqual(new Date(2026, 7, 15));

    const result = mapRowsToPayload([
      {
        ...createEmptyRow(),
        id: 'invalid-row',
        startsOn: new Date('invalid'),
        categoryId,
        paymentMethodId,
        receiver: 'Rent',
      },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.rowId).toBe('invalid-row');
  });

  it('defines recurrence, paused, and relation columns as editable fields', () => {
    const recurringColumns = columns({
      categories: [{id: categoryId, name: 'Housing'}],
      paymentMethods: [{id: paymentMethodId, name: 'Checking'}],
    });
    expect(recurringColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({field: 'executionPlan', type: 'singleSelect', editable: true}),
        expect.objectContaining({field: 'startsOn', type: 'date', editable: true}),
        expect.objectContaining({field: 'paused', type: 'boolean', editable: true}),
        expect.objectContaining({field: 'paymentMethodId', type: 'singleSelect', editable: true}),
      ]),
    );
  });
});
