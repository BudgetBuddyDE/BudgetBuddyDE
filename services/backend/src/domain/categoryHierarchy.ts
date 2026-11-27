import {categories} from '@budgetbuddyde/db/backend';
import {and, eq, sql} from 'drizzle-orm';
import type {db} from '../db';
import {ApiResponse, ConflictError, HTTPStatusCode, NotFoundError} from '../models';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function lockCategoryHierarchy(tx: Transaction, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'category-hierarchy:' + userId}, 0))`);
}

/** Call after acquiring the owner's hierarchy lock. */
export async function checkExpectedCategoryParent(
  tx: Transaction,
  userId: string,
  id: string,
  expectedParentId: string | null,
) {
  const [current] = await tx
    .select({parentId: categories.parentId})
    .from(categories)
    .where(and(eq(categories.ownerId, userId), eq(categories.id, id)))
    .for('update');
  if (!current) throw new NotFoundError('Category not found');
  if (current.parentId !== (expectedParentId?.toLowerCase() ?? null)) {
    throw new ConflictError('Category placement changed. Review the current placement before moving it.');
  }
}

export function categoryWriteError(error: unknown) {
  const details = error as {constraint?: string; cause?: {constraint?: string}} | null;
  if ((details?.constraint ?? details?.cause?.constraint) === 'category_two_levels') {
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.BAD_REQUEST)
      .withMessage('Choose an existing root category. Categories with children cannot become children.')
      .build();
  }
  return ApiResponse.builder()
    .fromError(error instanceof Error ? error : new Error(String(error)))
    .build();
}
