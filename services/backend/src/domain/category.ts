import {CategorySchemas, categories} from '@budgetbuddyde/db/backend';
import {and, eq, sql} from 'drizzle-orm';
import {z} from 'zod';
import {db} from '../db';
import {ApiResponse, HTTPStatusCode, NotFoundError} from '../models';
import {invalidateDomainMutation} from './cache';
import {normalizeResponse} from './response';
import {assembleFilter} from '../router/assembleFilter';
import {paginationFields, paginationWindow, refinePagination} from '../router/pagination';

const listSchema = z.object({search: z.string().optional(), ...paginationFields}).superRefine(refinePagination);
const createSchema = CategorySchemas.insert
  .omit({ownerId: true})
  .extend({ownerId: CategorySchemas.insert.shape.ownerId.optional()});
const updateSchema = CategorySchemas.update
  .omit({ownerId: true})
  .extend({ownerId: CategorySchemas.update.shape.ownerId.optional()});

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
            return [operators.desc(fields.updatedAt)];
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

export async function create(userId: string, body: z.input<typeof createSchema>) {
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const input = parsed.data;
  const result = normalizeResponse(
    await (async () => {
      const requestBody = [input].map(body => {
        body.ownerId = userId;
        return body as z.infer<typeof CategorySchemas.insert>;
      });

      try {
        const createdRecords = await db.insert(categories).values(requestBody).returning();
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
        return ApiResponse.builder()
          .fromError(err instanceof Error ? err : new Error(String(err)))
          .build();
      }
    })(),
  );
  if (result.status < 400) await invalidateDomainMutation(userId, '/api/category');
  return result;
}

export async function update(userId: string, id: string, body: z.input<typeof updateSchema>) {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success || !CategorySchemas.select.shape.id.safeParse(id).success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const input = parsed.data;
  const result = normalizeResponse(
    await (async () => {
      const requestBody = input;
      requestBody.ownerId = userId;

      try {
        const updatedRecords = await db
          .update(categories)
          .set(requestBody)
          .where(and(eq(categories.ownerId, userId), eq(categories.id, id)))
          .returning();

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
        return ApiResponse.builder()
          .fromError(err instanceof Error ? err : new Error(String(err)))
          .build();
      }
    })(),
  );
  if (result.status < 400) await invalidateDomainMutation(userId, '/api/category');
  return result;
}

export async function remove(userId: string, id: string) {
  if (!CategorySchemas.select.shape.id.safeParse(id).success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const result = normalizeResponse(
    await (async () => {
      const entityId = id;

      try {
        const deletedRecord = await db
          .delete(categories)
          .where(and(eq(categories.ownerId, userId), eq(categories.id, entityId)))
          .returning();

        if (deletedRecord.length === 0) {
          throw new NotFoundError('Category not found');
        }
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
