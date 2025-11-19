import { Router } from 'express';
import { db } from '../db';
import { ApiResponse, HTTPStatusCode } from '../models';
import { categories } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { validateRequestBody } from '../middleware';
import { CategorySchemas } from '../db/schema/schemas';

export const categoryRouter = Router();

categoryRouter.get('/', async (req, res) => {
  const userId = req.context.user!.id;
  const categories = await db.query.categories.findMany({
    where(fields, operators) {
      return operators.eq(fields.owner, userId);
    },
  });

  ApiResponse.builder<typeof categories>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's categories successfully")
    .withData(categories)
    .withFrom('db')
    .buildAndSend(res);
});

categoryRouter.get('/:id', async (req, res) => {
  const userId = req.context.user!.id;
  const entityId = req.params.id;
  const category = await db.query.categories.findMany({
    where(fields, operators) {
      return operators.and(operators.eq(fields.owner, userId), operators.eq(fields.id, entityId));
    },
  });

  if (category.length === 0) {
    ApiResponse.builder()
      .withStatus(HTTPStatusCode.NOT_FOUND)
      .withMessage(`Category ${entityId} not found`)
      .withFrom('db')
      .buildAndSend(res);
    return;
  }

  ApiResponse.builder<(typeof category)[0]>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's category successfully")
    .withData(category[0])
    .withFrom('db')
    .buildAndSend(res);
});

categoryRouter.post(
  '/',
  validateRequestBody(
    CategorySchemas.insert.omit({
      owner: true,
    })
  ),
  async (req, res) => {
    const userId = req.context.user!.id;
    let requestBody = (Array.isArray(req.body) ? req.body : [req.body]).map((body) => {
      body.owner = userId;
      return body;
    });

    try {
      const createdEntites = await db.insert(categories).values(requestBody).returning();

      if (createdEntites.length === 0) {
        throw new Error('No category created');
      }

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Category created successfully')
        .withData(createdEntites)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  }
);

categoryRouter.put(
  '/:id',
  validateRequestBody(
    CategorySchemas.update.omit({
      owner: true,
    })
  ),
  async (req, res) => {
    const userId = req.context.user!.id;
    let requestBody = req.body;
    requestBody.owner = userId;

    try {
      const updatedEntites = await db
        .update(categories)

        .set(requestBody)
        .where(and(eq(categories.owner, userId), eq(categories.id, req.params.id)))
        .returning();

      if (updatedEntites.length === 0) {
        throw new Error('No category updated');
      }

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Category updated successfully')
        .withData(updatedEntites)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  }
);

categoryRouter.delete('/:id', async (req, res) => {
  const userId = req.context.user!.id;
  const entityId = req.params.id;

  try {
    const deletedEntities = await db
      .delete(categories)
      .where(and(eq(categories.owner, userId), eq(categories.id, entityId)))
      .returning();

    if (deletedEntities.length === 0) {
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
});
