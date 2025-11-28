import {and, eq} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {db} from '../db';
import {paymentMethods} from '../db/schema';
import {PaymentMethodSchemas} from '../db/schema/types';
import {ApiResponse, HTTPStatusCode} from '../models';

export const paymentMethodRouter = Router();

paymentMethodRouter.get('/', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }
  const records = await db.query.paymentMethods.findMany({
    where(fields, operators) {
      return operators.eq(fields.ownerId, userId);
    },
  });
  ApiResponse.builder<typeof records>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's payment methods successfully")
    .withData(records)
    .withFrom('db')
    .buildAndSend(res);
});

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
