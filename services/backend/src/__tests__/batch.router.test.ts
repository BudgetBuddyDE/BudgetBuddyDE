import {describe, expect, it, vi} from 'vitest';
import {z} from 'zod';
import {applyBatchUpdates, createBatchSchema, hasAllOwnedIds, MAX_BATCH_SIZE, updateBatchSchema} from '../router/batch';

describe('batch route contracts', () => {
  const item = z.object({name: z.string().min(1)});
  const id = z.string().uuid();
  const update = z.object({name: z.string().min(1).optional()});

  it('accepts one through one hundred create rows and rejects empty or oversized batches', () => {
    const schema = createBatchSchema(item);
    expect(schema.safeParse([{name: 'one'}]).success).toBe(true);
    expect(schema.safeParse(Array.from({length: MAX_BATCH_SIZE}, (_, index) => ({name: String(index)}))).success).toBe(
      true,
    );
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse(Array.from({length: MAX_BATCH_SIZE + 1}, () => ({name: 'too many'}))).success).toBe(false);
  });

  it('rejects malformed and duplicate update IDs before persistence', () => {
    const schema = updateBatchSchema(id, update);
    const firstId = '00000000-0000-4000-8000-000000000001';
    const secondId = '00000000-0000-4000-8000-000000000002';
    expect(
      schema.safeParse({
        updates: [
          {id: firstId, data: {name: 'updated'}},
          {id: secondId, data: {}},
        ],
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        updates: [
          {id: firstId, data: {}},
          {id: firstId, data: {}},
        ],
      }).success,
    ).toBe(false);
    expect(schema.safeParse({updates: [{id: 'not-a-uuid', data: {}}]}).success).toBe(false);
  });

  it('checks all requested IDs against the owner-filtered lookup', async () => {
    const findOwned = vi.fn(async (_userId: string, ids: readonly string[]) => ids.slice(0, 1).map(id => ({id})));
    await expect(hasAllOwnedIds('user-1', ['a', 'b'], findOwned)).resolves.toBe(false);
    expect(findOwned).toHaveBeenCalledWith('user-1', ['a', 'b']);
    await expect(hasAllOwnedIds('user-1', ['a'], findOwned)).resolves.toBe(true);
    await expect(hasAllOwnedIds('user-1', ['a', 'a'], findOwned)).resolves.toBe(true);
    expect(findOwned).toHaveBeenLastCalledWith('user-1', ['a']);
  });

  it('returns updates in request order and rolls back a failed transaction callback', async () => {
    let values = ['original-a', 'original-b'];
    const transaction = async <Result>(callback: (tx: object) => Promise<Result>) => {
      const snapshot = [...values];
      try {
        return await callback({});
      } catch (error) {
        values = snapshot;
        throw error;
      }
    };

    const success = await transaction(tx =>
      applyBatchUpdates(
        tx,
        [0, 1],
        async (_tx, index) => {
          values[index] = `updated-${index}`;
          return values[index];
        },
        index => `update ${index} failed`,
      ),
    );
    expect(success).toEqual(['updated-0', 'updated-1']);
    expect(values).toEqual(['updated-0', 'updated-1']);

    await expect(
      transaction(tx =>
        applyBatchUpdates(
          tx,
          [0, 1],
          async (_tx, index) => {
            values[index] = `failed-${index}`;
            return index === 0 ? values[index] : undefined;
          },
          index => `update ${index} failed`,
        ),
      ),
    ).rejects.toThrow('update 1 failed');
    expect(values).toEqual(['updated-0', 'updated-1']);
  });
});
