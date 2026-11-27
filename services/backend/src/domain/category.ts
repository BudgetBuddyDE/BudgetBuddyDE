import {
  attachments,
  CategorySchemas,
  categories,
  transactionAttachments,
  transactions,
} from '@budgetbuddyde/db/backend';
import {and, eq, gte, inArray, lt, notExists, or, sql} from 'drizzle-orm';
import {z} from 'zod';
import {db} from '../db';
import {ApiResponse, HTTPStatusCode, NotFoundError} from '../models';
import {invalidateDomainMutation} from './cache';
import {categoryWriteError, checkExpectedCategoryParent, lockCategoryHierarchy} from './categoryHierarchy';
import {normalizeResponse} from './response';
import {assembleFilter} from '../router/assembleFilter';
import {paginationFields, paginationWindow, refinePagination} from '../router/pagination';

const listSchema = z.object({search: z.string().optional(), ...paginationFields}).superRefine(refinePagination);
const createSchema = CategorySchemas.insert
  .omit({ownerId: true})
  .extend({ownerId: CategorySchemas.insert.shape.ownerId.optional()});
export const categoryUpdateSchema = CategorySchemas.update
  .pick({name: true, description: true, parentId: true})
  .extend({expectedParentId: CategorySchemas.select.shape.parentId.optional()})
  .refine(body => body.expectedParentId === undefined || body.parentId !== undefined, {
    message: 'A confirmed move must specify the new parent',
    path: ['parentId'],
  });

export async function list(userId: string, queryInput: z.input<typeof listSchema> = {}) {
  const parsed = listSchema.safeParse(queryInput);
  if (!parsed.success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const query = parsed.data;
  return normalizeResponse(
    await (async () => {
      const filter = assembleFilter(
        categories,
        {ownerColumnName: 'ownerId', ownerValue: userId},
        {
          searchTerm: query.search,
          searchableColumnName: ['name', 'description'],
        },
      );

      const [[{count: totalCount}], records] = await Promise.all([
        db
          .select({
            count: sql<number>`count(*)`.as('count'),
          })
          .from(categories)
          .where(filter)
          .limit(1),
        db.query.categories.findMany({
          where() {
            return filter;
          },
          orderBy(fields, operators) {
            return [
              sql`coalesce(${fields.parentId}, ${fields.id})`,
              sql`${fields.parentId} is not null`,
              operators.asc(fields.id),
            ];
          },
          ...paginationWindow(query),
        }),
      ]);

      return ApiResponse.builder<typeof records>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage("Fetched user's categories successfully")
        .withData(records)
        .withTotalCount(totalCount)
        .withFrom('db')
        .build();
    })(),
  );
}

export async function get(userId: string, id: string) {
  if (!CategorySchemas.select.shape.id.safeParse(id).success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  return normalizeResponse(
    await (async () => {
      const entityId = id;
      const record = await db.query.categories.findFirst({
        where(fields, operators) {
          return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
        },
      });

      if (!record) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.NOT_FOUND)
          .withMessage(`Category ${entityId} not found`)
          .withFrom('db')
          .build();
      }

      return ApiResponse.builder<typeof record>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage("Fetched user's category successfully")
        .withData(record)
        .withFrom('db')
        .build();
    })(),
  );
}

export async function getMonthlyBreakdown(userId: string, id: string, month: string) {
  const from = new Date(`${month.slice(0, 7)}-01`);
  const until = new Date(from);
  until.setUTCMonth(from.getUTCMonth() + 1);
  const fields = {
    id: categories.id,
    name: categories.name,
    description: categories.description,
    parentId: categories.parentId,
  };
  const data = await db.transaction(
    async tx => {
      const [category] = await tx
        .select(fields)
        .from(categories)
        .where(and(eq(categories.ownerId, userId), eq(categories.id, id)));
      if (!category) return null;
      const parentId = category.parentId;
      const parentName = parentId
        ? ((
            await tx
              .select({name: categories.name})
              .from(categories)
              .where(and(eq(categories.ownerId, userId), eq(categories.id, parentId)))
          )[0]?.name ?? null)
        : null;
      const rows = await tx
        .select({
          category: fields,
          income: sql<number>`coalesce(sum(greatest(${transactions.transferAmount}, 0)), 0)`,
          expenses: sql<number>`coalesce(sum(greatest(-${transactions.transferAmount}, 0)), 0)`,
        })
        .from(categories)
        .leftJoin(
          transactions,
          and(
            eq(transactions.ownerId, userId),
            eq(transactions.categoryId, categories.id),
            gte(transactions.processedAt, from),
            lt(transactions.processedAt, until),
          ),
        )
        .where(
          and(eq(categories.ownerId, userId), or(eq(categories.id, category.id), eq(categories.parentId, category.id))),
        )
        .groupBy(categories.id)
        .orderBy(categories.name, categories.id);
      const own = rows.find(row => row.category.id === category.id);
      const direct = {income: own?.income ?? 0, expenses: own?.expenses ?? 0};
      const children = rows.filter(row => row.category.id !== category.id);
      const total = children.reduce(
        (sum, child) => ({income: sum.income + child.income, expenses: sum.expenses + child.expenses}),
        direct,
      );
      return {category, parentName, direct, total, children};
    },
    {isolationLevel: 'repeatable read', accessMode: 'read only'},
  );
  return normalizeResponse(
    data
      ? ApiResponse.builder<typeof data>()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Fetched category breakdown')
          .withData(data)
          .withFrom('db')
          .build()
      : ApiResponse.builder().withStatus(HTTPStatusCode.NOT_FOUND).withMessage('Category not found').build(),
  );
}

export async function create(userId: string, body: z.input<typeof createSchema>) {
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const input = parsed.data;
  const result = normalizeResponse(
    await (async () => {
      try {
        const createdRecords = await db.transaction(async tx => {
          // Acquire the lock in a separate statement so the INSERT sees the latest hierarchy.
          await lockCategoryHierarchy(tx, userId);
          return tx
            .insert(categories)
            .values({...input, ownerId: userId})
            .returning();
        });
        if (createdRecords.length === 0) {
          throw new Error('No category created');
        }
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Category created successfully')
          .withData(createdRecords)
          .withFrom('db')
          .build();
      } catch (err) {
        return categoryWriteError(err);
      }
    })(),
  );
  if (result.status < 400) await invalidateDomainMutation(userId, '/api/category');
  return result;
}

export async function update(userId: string, id: string, body: z.input<typeof categoryUpdateSchema>) {
  const parsed = categoryUpdateSchema.safeParse(body);
  if (!parsed.success || !CategorySchemas.select.shape.id.safeParse(id).success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const {expectedParentId, ...changes} = parsed.data;
  const result = normalizeResponse(
    await (async () => {
      try {
        const scope = and(eq(categories.ownerId, userId), eq(categories.id, id));
        const update = (connection: Pick<typeof db, 'update'>) =>
          connection
            .update(categories)
            .set({...changes, updatedAt: new Date()})
            .where(scope)
            .returning();
        const updatedRecords =
          changes.parentId === undefined
            ? await update(db)
            : await db.transaction(async tx => {
                await lockCategoryHierarchy(tx, userId);
                if (expectedParentId !== undefined) {
                  await checkExpectedCategoryParent(tx, userId, id, expectedParentId);
                }
                return update(tx);
              });

        if (updatedRecords.length === 0) {
          throw new NotFoundError('Category not found');
        }
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Category updated successfully')
          .withData(updatedRecords)
          .withFrom('db')
          .build();
      } catch (err) {
        return categoryWriteError(err);
      }
    })(),
  );
  if (result.status < 400) await invalidateDomainMutation(userId, '/api/category');
  return result;
}

export async function remove(userId: string, id: string, confirmedChildIds?: readonly string[]) {
  if (!CategorySchemas.select.shape.id.safeParse(id).success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const result = normalizeResponse(
    await (async () => {
      const entityId = id.toLowerCase();

      try {
        const deletion = await db.transaction(async tx => {
          await lockCategoryHierarchy(tx, userId);
          // Lock referenced rows before collecting junction links. Foreign key checks on new
          // transactions and attachments must either finish first or wait for this deletion.
          const scope = and(
            eq(categories.ownerId, userId),
            or(eq(categories.id, entityId), eq(categories.parentId, entityId)),
          );
          const subtree = await tx
            .select({id: categories.id, parentId: categories.parentId})
            .from(categories)
            .where(scope)
            .orderBy(categories.id)
            .for('update');
          if (!subtree.some(row => row.id === entityId)) throw new NotFoundError('Category not found');
          const currentChildIds = subtree.filter(row => row.parentId === entityId).map(row => row.id);
          const confirmed = new Set(confirmedChildIds?.map(id => id.toLowerCase()));
          if (confirmed.size !== currentChildIds.length || currentChildIds.some(id => !confirmed.has(id))) return null;

          const affected = and(
            eq(transactions.ownerId, userId),
            inArray(transactions.categoryId, tx.select({id: categories.id}).from(categories).where(scope)),
          );
          await tx
            .select({id: transactions.id})
            .from(transactions)
            .where(affected)
            .orderBy(transactions.id)
            .for('update');
          const candidates = await tx
            .select({id: attachments.id})
            .from(attachments)
            .where(
              and(
                eq(attachments.ownerId, userId),
                inArray(
                  attachments.id,
                  tx
                    .select({id: transactionAttachments.attachmentId})
                    .from(transactionAttachments)
                    .where(
                      inArray(
                        transactionAttachments.transactionId,
                        tx.select({id: transactions.id}).from(transactions).where(affected),
                      ),
                    ),
                ),
              ),
            )
            .orderBy(attachments.id)
            .for('update');
          const deletedRecord = await tx
            .delete(categories)
            .where(and(eq(categories.ownerId, userId), eq(categories.id, entityId)))
            .returning();
          if (deletedRecord.length === 0) throw new NotFoundError('Category not found');
          // The cascade removes the junction rows, so keep the locked candidate IDs and
          // recheck their remaining links in bounded batches after the cascade.
          const orphaned: Pick<typeof attachments.$inferSelect, 'id' | 'location'>[] = [];
          for (let offset = 0; offset < candidates.length; offset += 1000) {
            const ids = candidates.slice(offset, offset + 1000).map(row => row.id);
            const deleted = await tx
              .delete(attachments)
              .where(
                and(
                  eq(attachments.ownerId, userId),
                  inArray(attachments.id, ids),
                  notExists(
                    tx
                      .select()
                      .from(transactionAttachments)
                      .where(eq(transactionAttachments.attachmentId, attachments.id)),
                  ),
                ),
              )
              .returning({id: attachments.id, location: attachments.location});
            orphaned.push(...deleted);
          }
          const service = orphaned.length > 0 ? (await import('./transaction')).getAttachmentService() : undefined;
          return {orphaned, service};
        });
        if (!deletion)
          return ApiResponse.builder()
            .withStatus(HTTPStatusCode.BAD_REQUEST)
            .withMessage(
              'Deletion scope does not match the current children. Open category management and confirm the current scope.',
            )
            .build();
        if (deletion.service) await deletion.service.cleanupDeletedAttachments(deletion.orphaned);
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Category deleted successfully')
          .withFrom('db')
          .build();
      } catch (err) {
        return ApiResponse.builder()
          .fromError(err instanceof Error ? err : new Error(String(err)))
          .build();
      }
    })(),
  );
  if (result.status < 400) await invalidateDomainMutation(userId, '/api/category');
  return result;
}
