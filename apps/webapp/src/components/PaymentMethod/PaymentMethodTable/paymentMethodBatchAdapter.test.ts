import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {describe, expect, it} from 'vitest';
import {columns, createEmptyRow, fromEntity, mapRowsToPayload} from './paymentMethodBatchAdapter';

describe('payment method batch adapter', () => {
  it('creates an empty row and normalizes an empty description', () => {
    const row = createEmptyRow();
    expect(row).toMatchObject({name: '', provider: '', address: '', description: null});

    const result = mapRowsToPayload([{...row, name: 'Checking', provider: 'Bank', address: 'IBAN', description: ''}]);
    expect(result).toEqual({
      success: true,
      payload: [{name: 'Checking', provider: 'Bank', address: 'IBAN', description: null}],
    });
  });

  it('maps existing fields and rejects values beyond backend limits', () => {
    const entity = {
      id: '00000000-0000-4000-8000-000000000002',
      ownerId: 'owner',
      name: 'Checking',
      provider: 'Bank',
      address: 'IBAN',
      description: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as TPaymentMethod;
    expect(fromEntity(entity)).toMatchObject({id: entity.id, provider: entity.provider});

    const result = mapRowsToPayload([{...createEmptyRow(), id: 'too-long', provider: 'x'.repeat(33)}]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.rowId).toBe('too-long');
  });

  it('provides editable columns', () => {
    expect(columns()).toEqual(expect.arrayContaining([expect.objectContaining({field: 'provider', editable: true})]));
  });
});
