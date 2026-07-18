import type {TExpandedRecurringPayment, TRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {describe, expect, it} from 'vitest';
import {columns, createEmptyRow, fromEntity, mapRowsToPayload} from './recurringPaymentBatchAdapter';

const categoryId = '00000000-0000-4000-8000-000000000021' as TRecurringPayment['categoryId'];
const paymentMethodId = '00000000-0000-4000-8000-000000000022' as TRecurringPayment['paymentMethodId'];

describe('recurring payment batch adapter', () => {
  it('creates a current-day draft and preserves paused state in payloads', () => {
    const row = createEmptyRow();
    expect(row.executeAt).toBe(new Date().getDate());
    expect(row.paused).toBe(false);

    const result = mapRowsToPayload([
      {
        ...row,
        executeAt: 31,
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
          executeAt: 31,
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

  it('maps expanded rows and rejects days outside 1 through 31', () => {
    const entity = {
      id: '00000000-0000-4000-8000-000000000020',
      ownerId: 'owner',
      executeAt: 15,
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
    expect(fromEntity(entity)).toMatchObject({id: entity.id, executeAt: 15, paused: true});

    const result = mapRowsToPayload([
      {...createEmptyRow(), id: 'invalid-row', executeAt: 32, categoryId, paymentMethodId, receiver: 'Rent'},
    ]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.rowId).toBe('invalid-row');
  });

  it('defines paused and relation columns as editable fields', () => {
    const recurringColumns = columns({
      categories: [{id: categoryId, name: 'Housing'}],
      paymentMethods: [{id: paymentMethodId, name: 'Checking'}],
    });
    expect(recurringColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({field: 'paused', type: 'boolean', editable: true}),
        expect.objectContaining({field: 'paymentMethodId', type: 'singleSelect', editable: true}),
      ]),
    );
  });
});
