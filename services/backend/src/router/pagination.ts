import {z} from 'zod';
import {config} from '../config';

/** Shared `from`/`to` pagination fields for list endpoints. `to` is exclusive. */
export const paginationFields = {
  from: z.coerce.number().int().nonnegative().optional(),
  to: z.coerce.number().int().nonnegative().optional(),
};

export type TPaginationQuery = z.infer<z.ZodObject<typeof paginationFields>>;

/** Validates the shared pagination fields. `to` omitted means an unbounded window. */
export function refinePagination(query: TPaginationQuery, context: z.RefinementCtx): void {
  if (query.to === undefined) return;
  const from = query.from ?? 0;
  if (query.to < from) {
    context.addIssue({code: 'custom', path: ['to'], message: 'to must be greater than or equal to from'});
    return;
  }
  if (query.to - from > config.pagination.maxPageSize) {
    context.addIssue({
      code: 'custom',
      path: ['to'],
      message: `Page size must not exceed ${config.pagination.maxPageSize}`,
    });
  }
}

/** Translates a validated pagination query into Drizzle offset/limit values. */
export function paginationWindow({from, to}: TPaginationQuery): {
  offset: number | undefined;
  limit: number | undefined;
} {
  return {offset: from, limit: to === undefined ? undefined : to - (from ?? 0)};
}
