import {and, eq} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {db} from '../db';
import {categories} from '../db/schema';
import {CategorySchemas} from '../db/schema/types';
import {ApiResponse, HTTPStatusCode} from '../models';

export const categoryRouter = Router();

categoryRouter.get(
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
    const records = await db.query.categories.findMany({
      where(fields, operators) {
        if (req.query.search) {
          return operators.and(
            operators.eq(fields.ownerId, userId),
            operators.or(
              operators.ilike(fields.name, `%${req.query.search}%`),
              operators.ilike(fields.description, `%${req.query.search}%`),
            ),
          );
        }
        return operators.eq(fields.ownerId, userId);
      },
      offset: req.query.from,
      limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
    });

    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's categories successfully")
      .withData(records)
      .withFrom('db')
      .buildAndSend(res);
  },
);

categoryRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: CategorySchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;
    const record = await db.query.categories.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
    });

    if (!record) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Category ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    ApiResponse.builder<typeof record>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's category successfully")
      .withData(record)
      .withFrom('db')
      .buildAndSend(res);
  },
);

categoryRouter.post(
  '/',
  validateRequest({
    body: CategorySchemas.insert.omit({ownerId: true}).extend({
      ownerId: CategorySchemas.insert.shape.ownerId.optional(),
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
      return body as z.infer<typeof CategorySchemas.insert>;
    });

    try {
      const createdRecords = await db.insert(categories).values(requestBody).returning();
      if (createdRecords.length === 0) {
        throw new Error('No category created');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Category created successfully')
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

categoryRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: CategorySchemas.select.shape.id,
    }),
    body: CategorySchemas.update.omit({ownerId: true}).extend({
      ownerId: CategorySchemas.update.shape.ownerId.optional(),
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
      const updatedRecords = await db
        .update(categories)
        .set(requestBody)
        .where(and(eq(categories.ownerId, userId), eq(categories.id, req.params.id)))
        .returning();

      if (updatedRecords.length === 0) {
        throw new Error('No category updated');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Category updated successfully')
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

categoryRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: CategorySchemas.select.shape.id,
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
        .delete(categories)
        .where(and(eq(categories.ownerId, userId), eq(categories.id, entityId)))
        .returning();

      if (deletedRecord.length === 0) {
        throw new Error('No category deleted');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Category deleted successfully')
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);
