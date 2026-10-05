export {recurringPaymentOccurrencesQuerySchema, expandRecurringPaymentOccurrences} from '../domain/recurringPayment';
import {RecurringPaymentSchemas, recurringPayments} from '@budgetbuddyde/db/backend';
import {and, eq} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {db} from '../db';
import {applyBatchUpdates, createBatchSchema, hasAllOwnedIds, ownedIdsFinder, updateBatchSchema} from './batch';
import {
  createRecurringPayment,
  getRecurringPayment,
  listRecurringPayments,
  listRecurringPaymentOccurrences,
  updateRecurringPayment,
  removeRecurringPayment,
  recurringPaymentListSchema,
  recurringPaymentOccurrencesQuerySchema,
  createRecurringPaymentSchema,
  updateRecurringPaymentSchema,
} from '../domain/recurringPayment';
import {executeDomain} from '../domain/response';
import {invalidateUserCaches} from '../middleware/cache.middleware';
import {ApiResponse, HTTPStatusCode} from '../models';
import {createTransactionFromRecurringPayment} from '../utils/createTransactionFromRecurringPayment';

export const recurringPaymentRouter = Router();

recurringPaymentRouter.get(
  '/',
  validateRequest({
    query: recurringPaymentListSchema,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => listRecurringPayments(userId, req.query));
  },
);

recurringPaymentRouter.get(
  '/occurrences',
  validateRequest({query: recurringPaymentOccurrencesQuerySchema}),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => listRecurringPaymentOccurrences(userId, req.query));
  },
);

recurringPaymentRouter.post(
  '/batch',
  validateRequest({
    body: createBatchSchema(createRecurringPaymentSchema),
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
      hasAllOwnedIds(userId, categoryIds, ownedIdsFinder(db.query.categories)),
      hasAllOwnedIds(userId, paymentMethodIds, ownedIdsFinder(db.query.paymentMethods)),
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
    body: updateBatchSchema(RecurringPaymentSchemas.select.shape.id, updateRecurringPaymentSchema),
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
      hasAllOwnedIds(userId, ids, ownedIdsFinder(db.query.recurringPayments)),
      hasAllOwnedIds(userId, categoryIds, ownedIdsFinder(db.query.categories)),
      hasAllOwnedIds(userId, paymentMethodIds, ownedIdsFinder(db.query.paymentMethods)),
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

    await executeDomain(res, () => getRecurringPayment(userId, req.params.id));
  },
);

recurringPaymentRouter.post(
  '/',
  validateRequest({
    body: createRecurringPaymentSchema,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => createRecurringPayment(userId, req.body));
  },
);

recurringPaymentRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: RecurringPaymentSchemas.select.shape.id,
    }),
    body: updateRecurringPaymentSchema,
  }),

  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => updateRecurringPayment(userId, req.params.id, req.body));
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
      await invalidateUserCaches(userId, ['/api/transaction', '/api/budget', '/api/insights']);
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

    await executeDomain(res, () => removeRecurringPayment(userId, req.params.id));
  },
);
