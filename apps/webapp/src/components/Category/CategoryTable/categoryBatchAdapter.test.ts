import type {TCategory} from '@budgetbuddyde/api/category';
import {describe, expect, it} from 'vitest';
import {columns, createEmptyRow, fromEntity, mapRowsToPayload} from './categoryBatchAdapter';

describe('category batch adapter', () => {
  it('creates an empty row and maps optional descriptions to null', () => {
    const row = createEmptyRow();
    expect(row.name).toBe('');
    expect(row.description).toBeNull();

    const result = mapRowsToPayload([{...row, name: 'Groceries', description: ''}]);
    expect(result).toEqual({success: true, payload: [{name: 'Groceries', description: null}]});
  });

  it('maps an existing entity and reports invalid required fields by row', () => {
    const entity = {
      id: '00000000-0000-4000-8000-000000000001',
      ownerId: 'owner',
      name: 'Groceries',
      description: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as TCategory;
    expect(fromEntity(entity)).toMatchObject({id: entity.id, name: entity.name});

    const result = mapRowsToPayload([{...createEmptyRow(), id: 'invalid-row'}]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.rowId).toBe('invalid-row');
  });

  it('provides editable columns', () => {
    expect(columns()).toEqual(expect.arrayContaining([expect.objectContaining({field: 'name', editable: true})]));
  });
});
