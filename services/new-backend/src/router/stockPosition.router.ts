import type {AssetType} from '@budgetbuddyde/types';
import {and, eq} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {db} from '../db';
import {stockExchanges, stockPositionGroupedView, stockPositions} from '../db/schema';
import {StockPositionSchemas} from '../db/schema/types';
import {logger} from '../lib';
import {Parqet} from '../lib/services';
import {ApiResponse, HTTPStatusCode} from '../models';

// TODO: Move to utils file
type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
// TODO: Move to utils file

function toDecimal(num: number, fractionDigits: number = 2): number {
  return Number(num.toFixed(fractionDigits));
}

export const stockPositionRouter = Router();

stockPositionRouter.get('/allocation', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }
  const records = await db
    .select()
    .from(stockPositionGroupedView)
    .innerJoin(stockExchanges, eq(stockPositionGroupedView.stockExchangeSymbol, stockExchanges.symbol))
    .where(eq(stockPositionGroupedView.ownerId, userId));
  const uniqueIdentifiers = Array.from(new Set(records.map(record => record.stock_position_grouped.identifier)));
  const assetDetailsPromises = uniqueIdentifiers.map(async (identifier: string) => {
    const [assetDetails, err] = await Parqet.getAsset(identifier);
    return {identifier, assetDetails, err};
  });
  const assetDetailsResults = await Promise.allSettled(assetDetailsPromises);

  // Create a Map for quick access to asset details
  const assetDetailsMap = new Map();
  assetDetailsResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && !result.value.err) {
      assetDetailsMap.set(uniqueIdentifiers[index], result.value.assetDetails);
    } else {
      const identifier = uniqueIdentifiers[index];
      const error = result.status === 'rejected' ? result.reason : result.value.err;
      logger.error(`Error fetching asset details for identifier ${identifier}: ${error.message}`);
    }
  });
});

stockPositionRouter.get('/summary', (_req, res) => {
  res.json({msg: 'Get asset summary (KPIs) - to be implemented'});
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
  const uniqueIdentifiers = Array.from(new Set(records.map(record => record.identifier)));
  const assetDetailsPromises = uniqueIdentifiers.map(async (identifier: string) => {
    const [assetDetails, err] = await Parqet.getAsset(identifier);
    return {identifier, assetDetails, err};
  });
  const assetDetailsResults = await Promise.allSettled(assetDetailsPromises);

  // Create a Map for quick access to asset details
  const assetDetailsMap = new Map();
  assetDetailsResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && !result.value.err) {
      assetDetailsMap.set(uniqueIdentifiers[index], result.value.assetDetails);
    } else {
      const identifier = uniqueIdentifiers[index];
      const error = result.status === 'rejected' ? result.reason : result.value.err;
      logger.error(`Error fetching asset details for identifier ${identifier}: ${error.message}`);
    }
  });

  // Update all positions with the fetched data
  const enhancedRecords = [] as (ArrayElement<typeof records> & {
    logoUrl: string;
    securityName: string;
    assetType: z.infer<typeof AssetType>;
    currentPrice: number;
    absoluteProfit: number;
    relativeProfit: number;
    positionValue: number;
  })[];
  for (const record of records) {
    if (!record.purchasePrice || !record.quantity) {
      logger.warn(`Skipping position ${record.id} due to missing purchasePrice or quantity`);
      continue;
    }
    const assetDetails = assetDetailsMap.get(record.identifier);
    if (!assetDetails) {
      logger.warn(`No asset details found for identifier ${record.identifier}`);
      continue;
    }

    const enhancedRecord = {...record} as ArrayElement<typeof enhancedRecords>;
    const currentPricePerShare = assetDetails.quote.price;
    const positionPurchasePrice = enhancedRecord.purchasePrice + enhancedRecord.purchaseFee;
    const currentPositionValue = currentPricePerShare * enhancedRecord.quantity;
    const absoluteProfit = currentPositionValue - positionPurchasePrice;
    enhancedRecord.logoUrl = assetDetails.asset.logo;
    enhancedRecord.securityName = assetDetails.asset.name;
    enhancedRecord.assetType = assetDetails.asset.assetType;
    enhancedRecord.currentPrice = toDecimal(currentPricePerShare);
    enhancedRecord.absoluteProfit = toDecimal(absoluteProfit);
    enhancedRecord.relativeProfit = toDecimal((absoluteProfit / positionPurchasePrice) * 100);
    enhancedRecord.positionValue = toDecimal(currentPositionValue);

    enhancedRecords.push(enhancedRecord);
  }

  ApiResponse.builder<typeof enhancedRecords>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's stock positions successfully")
    .withData(enhancedRecords)
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

    const [assetDetails, err] = await Parqet.getAsset(record.identifier);
    if (err) {
      return ApiResponse.builder().fromError(err).buildAndSend(res);
    }
    if (!assetDetails) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Asset details for identifier ${record.identifier} not found`)
        .withFrom('external')
        .buildAndSend(res);
    }

    const enhancedRecord = {...record} as typeof record & {
      logoUrl: string;
      securityName: string;
      assetType: z.infer<typeof AssetType>;
      currentPrice: number;
      absoluteProfit: number;
      relativeProfit: number;
      positionValue: number;
    };
    const currentPricePerShare = assetDetails.quote?.price || 0;
    const positionPurchasePrice = enhancedRecord.purchasePrice + enhancedRecord.purchaseFee;
    const currentPositionValue = currentPricePerShare * enhancedRecord.quantity;
    const absoluteProfit = currentPositionValue - positionPurchasePrice;
    enhancedRecord.logoUrl = assetDetails.asset.logo;
    enhancedRecord.securityName = assetDetails.asset.name;
    enhancedRecord.assetType = assetDetails.asset.assetType;
    enhancedRecord.currentPrice = toDecimal(currentPricePerShare);
    enhancedRecord.absoluteProfit = toDecimal(absoluteProfit);
    enhancedRecord.relativeProfit = toDecimal((absoluteProfit / positionPurchasePrice) * 100);
    enhancedRecord.positionValue = toDecimal(currentPositionValue);

    ApiResponse.builder<typeof enhancedRecord>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's stock position successfully")
      .withData(enhancedRecord)
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
