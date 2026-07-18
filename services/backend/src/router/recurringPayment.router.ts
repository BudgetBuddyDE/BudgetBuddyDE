import {Category} from '@budgetbuddyde/api/category';
import {PaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {RecurringPaymentSchemas, recurringPayments} from '@budgetbuddyde/db/backend';
import {and, eq, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {db} from '../db';
import {ApiResponse, HTTPStatusCode} from '../models';
import {assembleFilter, type TAdditionalFilter} from './assembleFilter';
import {applyBatchUpdates, createBatchSchema, hasAllOwnedIds, updateBatchSchema} from './batch';
import {createTransactionFromRecurringPayment} from '../utils/createTransactionFromRecurringPayment';

export const recurringPaymentRouter = Router();

recurringPaymentRouter.get(
  '/',
  validateRequest({
    query: z.object({
      search: z.string().optional(),
      from: z.coerce.number().optional(),
      to: z.coerce.number().optional(),
      $paused: z.coerce.boolean().optional(),
      $executeFrom: z.coerce.number().min(1).max(31).optional(),
      $executeTo: z.coerce.number().min(1).max(31).optional(),
      $categories: z
        .array(Category.shape.id)
        .or(Category.shape.id)
        .transform(value => (Array.isArray(value) ? value : [value]))
        .optional(),
      $excl_categories: z
        .array(Category.shape.id)
        .or(Category.shape.id)
        .transform(value => (Array.isArray(value) ? value : [value]))
        .optional(),
      $paymentMethods: z
        .array(PaymentMethod.shape.id)
        .or(PaymentMethod.shape.id)
        .transform(value => (Array.isArray(value) ? value : [value]))
        .optional(),
      $excl_paymentMethods: z
        .array(PaymentMethod.shape.id)
        .or(PaymentMethod.shape.id)
        .transform(value => (Array.isArray(value) ? value : [value]))
        .optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const query = req.query;
    const additionalFilters: TAdditionalFilter<(typeof recurringPayments)['_']['config']>[] = [];
    if (query.$paused !== undefined) {
      additionalFilters.push({columnName: 'paused', operator: 'eq', value: query.$paused});
    }
    if (query.$executeFrom) {
      additionalFilters.push({columnName: 'executeAt', operator: 'gte', value: query.$executeFrom});
    }
    if (query.$executeTo) {
      additionalFilters.push({columnName: 'executeAt', operator: 'lte', value: query.$executeTo});
    }
    if (query.$categories) {
      additionalFilters.push({columnName: 'categoryId', operator: 'in', value: query.$categories});
    }
    if (query.$excl_categories) {
      additionalFilters.push({columnName: 'categoryId', operator: 'notIn', value: query.$excl_categories});
    }
    if (query.$paymentMethods) {
      additionalFilters.push({columnName: 'paymentMethodId', operator: 'in', value: query.$paymentMethods});
    }
    if (query.$excl_paymentMethods) {
      additionalFilters.push({columnName: 'paymentMethodId', operator: 'notIn', value: query.$excl_paymentMethods});
    }
    const filter = assembleFilter(
      recurringPayments,
      {ownerColumnName: 'ownerId', ownerValue: userId},
      {
        searchTerm: query.search,
        searchableColumnName: ['receiver', 'information'],
      },
      additionalFilters,
    );

    const [[{count: totalCount}], records] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`.as('count'),
        })
        .from(recurringPayments)
        .where(filter)
        .limit(1),
      db.query.recurringPayments.findMany({
        where() {
          return filter;
        },
        orderBy(fields, operators) {
          return [operators.desc(fields.executeAt), operators.desc(fields.updatedAt)];
        },
        offset: req.query.from,
        limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
        with: {
          category: true,
          paymentMethod: true,
        },
      }),
    ]);

    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's recurring payments successfully")
      .withTotalCount(totalCount)
      .withData(records)
      .withFrom('db')
      .buildAndSend(res);
  },
);

recurringPaymentRouter.post(
  '/batch',
  validateRequest({
    body: createBatchSchema(
      RecurringPaymentSchemas.insert.omit({ownerId: true}).extend({
        executeAt: z.coerce.number().int().min(1).max(31),
      }),
    ),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const categoryIds = [...new Set(req.body.map(body => body.categoryId))];
    const paymentMethodIds = [...new Set(req.body.map(body => body.paymentMethodId))];
    const [categoriesOwned, paymentMethodsOwned] = await Promise.all([
      hasAllOwnedIds(userId, categoryIds, async (owner, ids) =>
        db.query.categories.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, ids));
          },
        }),
      ),
      hasAllOwnedIds(userId, paymentMethodIds, async (owner, ids) =>
        db.query.paymentMethods.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, ids));
          },
        }),
      ),
    ]);
    if (!categoriesOwned || !paymentMethodsOwned) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('One or more referenced categories or payment methods are invalid')
        .buildAndSend(res);
      return;
    }

    try {
      const createdRecords = await db.transaction(async tx => {
        const records = await tx
          .insert(recurringPayments)
          .values(req.body.map(body => ({...body, ownerId: userId})))
          .returning();
        if (records.length !== req.body.length)
          throw new Error('Batch recurring payment create returned an unexpected row count');
        return records;
      });
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Recurring payments created successfully')
        .withData(createdRecords)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

recurringPaymentRouter.put(
  '/batch',
  validateRequest({
    body: updateBatchSchema(
      RecurringPaymentSchemas.select.shape.id,
      RecurringPaymentSchemas.update.omit({ownerId: true, id: true, createdAt: true, updatedAt: true}).extend({
        executeAt: z.coerce.number().int().min(1).max(31).optional(),
      }),
    ),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const updates = req.body.updates as Array<{id: string; data: z.infer<typeof RecurringPaymentSchemas.update>}>;
    const ids = updates.map(update => update.id);
    const categoryIds = [
      ...new Set(updates.flatMap(update => (update.data.categoryId ? [update.data.categoryId] : []))),
    ];
    const paymentMethodIds = [
      ...new Set(updates.flatMap(update => (update.data.paymentMethodId ? [update.data.paymentMethodId] : []))),
    ];
    const [owned, categoriesOwned, paymentMethodsOwned] = await Promise.all([
      hasAllOwnedIds(userId, ids, async (owner, targetIds) =>
        db.query.recurringPayments.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, targetIds));
          },
        }),
      ),
      hasAllOwnedIds(userId, categoryIds, async (owner, targetIds) =>
        db.query.categories.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, targetIds));
          },
        }),
      ),
      hasAllOwnedIds(userId, paymentMethodIds, async (owner, targetIds) =>
        db.query.paymentMethods.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, targetIds));
          },
        }),
      ),
    ]);
    if (!owned) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage('One or more recurring payments were not found')
        .buildAndSend(res);
      return;
    }
    if (!categoriesOwned || !paymentMethodsOwned) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('One or more referenced categories or payment methods are invalid')
        .buildAndSend(res);
      return;
    }

    try {
      const updatedRecords = await db.transaction(tx =>
        applyBatchUpdates(
          tx,
          updates,
          async (transaction, update) => {
            const [record] = await transaction
              .update(recurringPayments)
              .set({...update.data, ownerId: userId})
              .where(and(eq(recurringPayments.ownerId, userId), eq(recurringPayments.id, update.id)))
              .returning();
            return record;
          },
          update => `Recurring payment ${update.id} could not be updated`,
        ),
      );
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Recurring payments updated successfully')
        .withData(updatedRecords)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

recurringPaymentRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: RecurringPaymentSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;
    const records = await db.query.recurringPayments.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
      with: {
        category: true,
        paymentMethod: true,
      },
    });
    if (!records) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Recurring payment ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }
    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's recurring payment successfully")
      .withData(records)
      .withFrom('db')
      .buildAndSend(res);
  },
);

recurringPaymentRouter.post(
  '/',
  validateRequest({
    body: RecurringPaymentSchemas.insert.omit({ownerId: true}).extend({
      ownerId: RecurringPaymentSchemas.insert.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const requestBody = [req.body].map(body => {
      body.ownerId = userId;
      return body as z.infer<typeof RecurringPaymentSchemas.insert>;
    });

    try {
      const createdRecords = await db.insert(recurringPayments).values(requestBody).returning();
      if (createdRecords.length === 0) {
        throw new Error('No recurring payment created');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Recurring payment created successfully')
        .withData(createdRecords)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

recurringPaymentRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: RecurringPaymentSchemas.select.shape.id,
    }),
    body: RecurringPaymentSchemas.update.omit({ownerId: true}).extend({
      ownerId: RecurringPaymentSchemas.update.shape.ownerId.optional(),
    }),
  }),

  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const requestBody = req.body;
    requestBody.ownerId = userId;

    try {
      const updatedRecord = await db
        .update(recurringPayments)
        .set(requestBody)
        .where(and(eq(recurringPayments.ownerId, userId), eq(recurringPayments.id, req.params.id)))
        .returning();
      if (updatedRecord.length === 0) {
        throw new Error('No recurring payment updated');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Recurring payment updated successfully')
        .withData(updatedRecord)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

recurringPaymentRouter.post(
  '/:id/execute',
  validateRequest({
    params: z.object({
      id: RecurringPaymentSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const entityId = req.params.id;
    const payment = await db.query.recurringPayments.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
    });

    if (!payment) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Recurring payment ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    try {
      const createdTransaction = await createTransactionFromRecurringPayment(payment);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transaction created successfully')
        .withData(createdTransaction)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

recurringPaymentRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: RecurringPaymentSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;
    try {
      const deletedRecord = await db
        .delete(recurringPayments)
        .where(and(eq(recurringPayments.ownerId, userId), eq(recurringPayments.id, entityId)))
        .returning();
      if (deletedRecord.length === 0) {
        throw new Error('No recurring payment deleted');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Recurring payment deleted successfully')
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);
