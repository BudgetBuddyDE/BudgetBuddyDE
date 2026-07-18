import {z} from 'zod';

export const MAX_BATCH_SIZE = 100;

export function createBatchSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.array(itemSchema).min(1).max(MAX_BATCH_SIZE);
}

export function updateBatchSchema<Id extends z.ZodTypeAny, Data extends z.ZodTypeAny>(idSchema: Id, dataSchema: Data) {
  return z
    .object({
      updates: z
        .array(z.object({id: idSchema, data: dataSchema}))
        .min(1)
        .max(MAX_BATCH_SIZE),
    })
    .superRefine((value, ctx) => {
      const ids = (value as {updates: Array<{id: unknown}>}).updates.map(update => update.id);
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({code: z.ZodIssueCode.custom, path: ['updates'], message: 'Update IDs must be unique'});
      }
    });
}

export async function hasAllOwnedIds(
  userId: string,
  ids: readonly string[],
  findOwned: (userId: string, ids: readonly string[]) => Promise<readonly {id: string}[]>,
): Promise<boolean> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return true;
  const owned = await findOwned(userId, uniqueIds);
  return owned.length === uniqueIds.length;
}

export async function applyBatchUpdates<Tx, Update, Result>(
  tx: Tx,
  updates: readonly Update[],
  apply: (tx: Tx, update: Update) => Promise<Result | undefined>,
  errorMessage: (update: Update) => string,
): Promise<Result[]> {
  const records: Result[] = [];
  for (const update of updates) {
    const record = await apply(tx, update);
    if (!record) throw new Error(errorMessage(update));
    records.push(record);
  }
  return records;
}
