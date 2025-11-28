import {AssetIdentifier, type ParqetSchemas} from '@budgetbuddyde/types';
import {and, eq} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {db} from '../db';
import {stockPositions} from '../db/schema';
import {StockPositionSchemas} from '../db/schema/types';
import {logger} from '../lib';
import {AssetCache} from '../lib/cache/asset.cache';
import {Parqet} from '../lib/services';
import {ApiResponse, HTTPStatusCode} from '../models';

export const stockPositionRouter = Router();

stockPositionRouter.get('/search', (_req, res) => {
  res.json({msg: 'Search assets - to be implemented'});
});

stockPositionRouter.get('/allocation', (_req, res) => {
  res.json({msg: 'Get asset allocation - to be implemented'});
});

stockPositionRouter.get('/summary', (_req, res) => {
  res.json({msg: 'Get asset summary (KPIs) - to be implemented'});
});

stockPositionRouter.get('/dividends', (_req, res) => {
  res.json({msg: 'Get dividend overview - to be implemented'});
});

stockPositionRouter.get(
  '/relatedAssets/:identifier',
  validateRequest({
    params: z.object({
      identifier: AssetIdentifier,
    }),
  }),
  (req, res) => {
    const identifier = req.params.identifier;
    res.json({msg: `Get related assets for ${identifier} - to be implemented`});
  },
);

stockPositionRouter.get(
  '/static/:mapping',
  validateRequest({
    params: z.object({
      mapping: z.enum(['sectors', 'industries', 'countries', 'regions']),
    }),
  }),
  async (req, res) => {
    const mappingKey = req.params.mapping;

    const assetCache = new AssetCache();
    if (mappingKey === 'countries') {
      const cachedValues = await assetCache.getCountries();
      if (cachedValues) {
        logger.debug(`Returning cached values for '${mappingKey}'`, {
          count: cachedValues.length,
        });
        return ApiResponse.builder<typeof cachedValues>()
          .withMessage(`Fetched '${mappingKey}' successfully`)
          .withData(cachedValues)
          .withFrom('cache')
          .buildAndSend(res);
      }

      const [countries, err] = await Parqet.getCountries();
      if (err) {
        return ApiResponse.builder().fromError(err).buildAndSend(res);
      }

      await assetCache.setCountries(countries);
      return ApiResponse.builder<typeof countries>()
        .withMessage(`Fetched '${mappingKey}' successfully`)
        .withData(countries)
        .withFrom('external')
        .buildAndSend(res);
    } else {
      const cachedValues = await assetCache.getMapping(mappingKey);
      if (cachedValues) {
        logger.debug(`Returning cached values for '${mappingKey}'`, {
          count: cachedValues.length,
        });
        return ApiResponse.builder<typeof cachedValues>()
          .withMessage(`Fetched '${mappingKey}' successfully`)
          .withData(cachedValues)
          .withFrom('cache')
          .buildAndSend(res);
      }

      let fetchedData: z.infer<
        typeof ParqetSchemas.Sector | typeof ParqetSchemas.Region | typeof ParqetSchemas.Industry
      >[] = [];
      try {
        switch (mappingKey) {
          case 'sectors': {
            const [sectors, err] = await Parqet.getSectors();
            if (err) throw err;
            fetchedData = sectors;
            break;
          }
          case 'regions': {
            const [regions, err] = await Parqet.getRegions();
            if (err) throw err;
            fetchedData = regions;
            break;
          }
          case 'industries': {
            const [industries, err] = await Parqet.getIndustries();
            if (err) throw err;
            fetchedData = industries;
            break;
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        return ApiResponse.builder().fromError(error).buildAndSend(res);
      }

      await assetCache.setMapping(mappingKey, fetchedData);
      return ApiResponse.builder<typeof fetchedData>()
        .withMessage(`Fetched '${mappingKey}' successfully`)
        .withData(fetchedData)
        .withFrom('external')
        .buildAndSend(res);
    }
  },
);

stockPositionRouter.get('/quotes', (_req, res) => {
  res.json({msg: 'Get stock quotes - to be implemented'});
});

stockPositionRouter.get('/', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }
  const records = await db.query.stockPositions.findMany({
    where(fields, operators) {
      return operators.eq(fields.ownerId, userId);
    },
    with: {
      stockExchange: true,
    },
  });

  ApiResponse.builder<typeof records>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's stock positions successfully")
    .withData(records)
    .withFrom('db')
    .buildAndSend(res);
});

stockPositionRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: StockPositionSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;
    const record = await db.query.stockPositions.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
      with: {
        stockExchange: true,
      },
    });

    if (!record) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Stock position ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    ApiResponse.builder<typeof record>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's stock position successfully")
      .withData(record)
      .withFrom('db')
      .buildAndSend(res);
  },
);

stockPositionRouter.post(
  '/',
  validateRequest({
    body: StockPositionSchemas.insert.omit({ownerId: true}).extend({
      ownerId: StockPositionSchemas.insert.shape.ownerId.optional(),
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
      return body as z.infer<typeof StockPositionSchemas.insert>;
    });

    try {
      const createdRecords = await db.insert(stockPositions).values(requestBody).returning();
      if (createdRecords.length === 0) {
        throw new Error('No stock position created');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Stock position created successfully')
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

stockPositionRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: StockPositionSchemas.select.shape.id,
    }),
    body: StockPositionSchemas.update.omit({ownerId: true}).extend({
      ownerId: StockPositionSchemas.update.shape.ownerId.optional(),
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
        .update(stockPositions)
        .set(requestBody)
        .where(and(eq(stockPositions.ownerId, userId), eq(stockPositions.id, req.params.id)))
        .returning();

      if (updatedRecords.length === 0) {
        throw new Error('No stock position updated');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Stock position updated successfully')
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

stockPositionRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: StockPositionSchemas.select.shape.id,
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
        .delete(stockPositions)
        .where(and(eq(stockPositions.ownerId, userId), eq(stockPositions.id, entityId)))
        .returning();

      if (deletedRecord.length === 0) {
        throw new Error('No stock position deleted');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Stock position deleted successfully')
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);
