import {and, eq} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {db} from '../db';
import {recurringPayments} from '../db/schema';
import {RecurringPaymentSchemas} from '../db/schema/types';
import {ApiResponse, HTTPStatusCode} from '../models';

export const recurringPaymentRouter = Router();

recurringPaymentRouter.get(
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
    const records = await db.query.recurringPayments.findMany({
      where(fields, operators) {
        if (req.query.search) {
          return operators.and(
            operators.eq(fields.ownerId, userId),
            operators.or(
              operators.ilike(fields.receiver, `%${req.query.search}%`),
              operators.ilike(fields.information, `%${req.query.search}%`),
            ),
          );
        }
        return operators.eq(fields.ownerId, userId);
      },
      offset: req.query.from,
      limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
      with: {
        category: true,
        paymentMethod: true,
      },
    });
    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's recurring payments successfully")
      .withData(records)
      .withFrom('db')
      .buildAndSend(res);
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
