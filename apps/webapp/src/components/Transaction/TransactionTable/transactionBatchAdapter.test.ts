import type {TExpandedTransaction, TTransaction} from '@budgetbuddyde/api/transaction';
import {describe, expect, it} from 'vitest';
import {columns, createEmptyRow, fromEntity, mapRowsToPayload} from './transactionBatchAdapter';

const categoryId = '00000000-0000-4000-8000-000000000011' as TTransaction['categoryId'];
const paymentMethodId = '00000000-0000-4000-8000-000000000012' as TTransaction['paymentMethodId'];

describe('transaction batch adapter', () => {
  it('creates a draft with a date and maps transaction fields', () => {
    const row = createEmptyRow();
    const processedAt = new Date('2025-01-15T12:00:00.000Z');
    const result = mapRowsToPayload([
      {
        ...row,
        processedAt,
        categoryId,
        paymentMethodId,
        receiver: 'Utility company',
        transferAmount: 42.5,
        information: '',
      },
    ]);
    expect(result).toEqual({
      success: true,
      payload: [
        {
          processedAt,
          categoryId,
          paymentMethodId,
          receiver: 'Utility company',
          transferAmount: 42.5,
          information: null,
        },
      ],
    });
  });

  it('maps expanded relation IDs and reports invalid relation values', () => {
    const entity = {
      id: '00000000-0000-4000-8000-000000000010',
      ownerId: 'owner',
      processedAt: new Date('2025-01-15T12:00:00.000Z'),
      receiver: 'Utility company',
      transferAmount: 42.5,
      information: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: {id: categoryId, ownerId: 'owner', name: 'Utilities', description: null, createdAt: '', updatedAt: ''},
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
    } as unknown as TExpandedTransaction;
    expect(fromEntity(entity)).toMatchObject({id: entity.id, categoryId, paymentMethodId});

    const result = mapRowsToPayload([
      {...createEmptyRow(), id: 'invalid-row', categoryId: 'not-a-uuid', paymentMethodId},
    ]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.rowId).toBe('invalid-row');
  });

  it('defines relation value help and editable amount columns', () => {
    const transactionColumns = columns({
      categories: [{id: categoryId, name: 'Utilities'}],
      paymentMethods: [{id: paymentMethodId, name: 'Checking'}],
    });
    expect(transactionColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({field: 'categoryId', type: 'singleSelect', editable: true}),
        expect.objectContaining({field: 'transferAmount', type: 'number', editable: true}),
      ]),
    );
  });
});
