import {and, eq, inArray, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {db} from '../db';
import {paymentMethods, recurringPayments, transactions} from '../db/schema';
import {PaymentMethodSchemas} from '../db/schema/types';
import {logger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';
import {assembleFilter} from './assembleFilter';

export const paymentMethodRouter = Router();

paymentMethodRouter.post(
  '/merge',
  validateRequest({
    body: z.object({
      source: z.array(PaymentMethodSchemas.select.shape.id).transform(ids => new Set(ids)),
      target: PaymentMethodSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const {source, target} = req.body;
    logger.info(
      `Merging payment methods for user ${userId}: source=${Array.from(source).join(', ')} -> target=${target}`,
    );

    if (source.has(target)) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('Source payment methods cannot include the target payment method')
        .buildAndSend(res);
      return;
    }

    // Verify that sources are owned by the user
    const verifiedPaymentMethods = await db.query.paymentMethods.findMany({
      columns: {id: true},
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.ownerId, userId),
          operators.or(
            ...[...Array.from(source), target].map(id => operators.eq(fields.id, id)),
            operators.eq(fields.id, target),
          ),
        );
      },
    });

    if (verifiedPaymentMethods.length !== source.size + 1) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('One or more payment methods do not belong to the user or do not exist')
        .buildAndSend(res);
      return;
    }

    await db.transaction(async tx => {
      // Update transactions to point to the target payment method
      const updatedTransactions = await tx
        .update(transactions)
        .set({
          paymentMethodId: target,
        })
        .where(and(eq(transactions.ownerId, userId), inArray(transactions.categoryId, Array.from(source))))
        .returning();

      logger.info(`Updated ${updatedTransactions.length} transactions to point to payment method ${target}`);

      // Update recurring payments to point to the target payment method
      const updatedRecurringPayments = await tx
        .update(recurringPayments)
        .set({
          paymentMethodId: target,
        })
        .where(
          and(eq(recurringPayments.ownerId, userId), inArray(recurringPayments.paymentMethodId, Array.from(source))),
        )
        .returning();
      logger.info(`Updated ${updatedRecurringPayments.length} recurring payments to point to payment method ${target}`);

      // Delete source payment methods
      const deletedPaymentMethods = await tx
        .delete(paymentMethods)
        .where(and(eq(paymentMethods.ownerId, userId), inArray(paymentMethods.id, Array.from(source))))
        .returning();
      logger.info(`Deleted ${deletedPaymentMethods.length} source payment methods`);
    });

    ApiResponse.builder<{
      source: string[];
      target: string;
    }>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Payment methods merged successfully')
      .withData({
        source: Array.from(source),
        target,
      })
      .withFrom('db')
      .buildAndSend(res);
  },
);

paymentMethodRouter.get(
  '/',
  validateRequest({
    query: z.object({
      search: z.string().optional(),
      from: z.coerce.number().optional(),
      to: z.coerce.number().optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const filter = assembleFilter(
      paymentMethods,
      {ownerColumnName: 'ownerId', ownerValue: userId},
      {
        searchTerm: req.query.search,
        searchableColumnName: ['name', 'address', 'provider', 'description'],
      },
    );

    const [[{count: totalCount}], records] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`.as('count'),
        })
        .from(paymentMethods)
        .where(filter)
        .limit(1),
      db.query.paymentMethods.findMany({
        where() {
          return filter;
        },
        orderBy(fields, operators) {
          return [operators.desc(fields.updatedAt)];
        },
        offset: req.query.from,
        limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
      }),
    ]);

    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's payment methods successfully")
      .withTotalCount(totalCount)
      .withData(records)
      .withFrom('db')
      .buildAndSend(res);
  },
);

paymentMethodRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: PaymentMethodSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;
    const record = await db.query.paymentMethods.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
    });

    if (!record) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Payment method ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    ApiResponse.builder<typeof record>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's payment method successfully")
      .withData(record)
      .withFrom('db')
      .buildAndSend(res);
  },
);

paymentMethodRouter.post(
  '/',
  validateRequest({
    body: PaymentMethodSchemas.insert.omit({ownerId: true}).extend({
      ownerId: PaymentMethodSchemas.insert.shape.ownerId.optional(),
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
      return body as z.infer<typeof PaymentMethodSchemas.insert>;
    });

    try {
      const createdRecords = await db.insert(paymentMethods).values(requestBody).returning();
      if (createdRecords.length === 0) {
        throw new Error('No payment method created');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Payment method created successfully')
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

paymentMethodRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: PaymentMethodSchemas.select.shape.id,
    }),
    body: PaymentMethodSchemas.update.omit({ownerId: true}).extend({
      ownerId: PaymentMethodSchemas.update.shape.ownerId.optional(),
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
        .update(paymentMethods)
        .set(requestBody)
        .where(and(eq(paymentMethods.ownerId, userId), eq(paymentMethods.id, req.params.id)))
        .returning();
      if (updatedRecord.length === 0) {
        throw new Error('No payment method updated');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Payment method updated successfully')
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

paymentMethodRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: PaymentMethodSchemas.select.shape.id,
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
        .delete(paymentMethods)
        .where(and(eq(paymentMethods.ownerId, userId), eq(paymentMethods.id, entityId)))
        .returning();
      if (deletedRecord.length === 0) {
        throw new Error('No payment method deleted');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Payment method deleted successfully')
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);
