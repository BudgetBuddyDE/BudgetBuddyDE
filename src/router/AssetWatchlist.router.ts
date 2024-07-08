import {
  ApiResponse,
  HTTPStatusCode,
  PocketBaseCollection,
  type TAddWatchlistAssetPayload,
  type TAssetWatchlistWithQuote,
  type TDeleteWatchlistAssetPayload,
  ZAddWatchlistAssetPayload,
  ZAssetWatchlist,
  ZDeleteWatchlistAssetPayload,
  ZStockExchange,
  ZUser,
} from '@budgetbuddyde/types';
import express from 'express';
import {z} from 'zod';

import {logger} from '../core';
import {pb} from '../pocketbase';
import {StockService} from '../services';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const assets = await pb.collection(PocketBaseCollection.STOCK_WATCHLIST).getFullList({
      expand: 'owner,exchange',
    });
    const parsedRecord = z
      .array(
        z.object({
          ...ZAssetWatchlist.shape,
          ...z.object({
            expand: z.object({
              owner: ZUser,
              exchange: ZStockExchange,
            }),
          }).shape,
        }),
      )
      .safeParse(assets);
    if (!parsedRecord.success) throw parsedRecord.error;

    const [quotes, quoteError] = await StockService.getAssets(assets.map(asset => asset.isin));
    if (quoteError) throw quoteError;

    return res
      .status(HTTPStatusCode.Ok)
      .json(
        ApiResponse.builder()
          .withData(
            parsedRecord.data.map((record, idx) => {
              const asset = quotes[idx].asset;
              const quote = quotes[idx].quote;
              const obj: TAssetWatchlistWithQuote = {
                ...record,
                name: asset.name,
                logo: asset.logo,
                wkn: asset.security.wkn,
                quote: quote,
              };
              return obj;
            }),
          )
          .build(),
      )
      .end();
  } catch (error) {
    const err = error as Error;
    logger.error(err.message, {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(err.message).build())
      .end();
  }
});

router.post('/', async (req, res) => {
  const payload = req.body;
  if (!payload) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing payload').build())
      .end();
  }

  try {
    const parsingResult = z.array(ZAddWatchlistAssetPayload).safeParse(payload);
    if (!parsingResult.success) throw parsingResult.error;
    const parsedPayload = parsingResult.data;

    if (parsedPayload.length === 0) {
      return res
        .status(HTTPStatusCode.BadRequest)
        .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Empty payload').build())
        .end();
    }

    const addedRecordIds: TAddWatchlistAssetPayload['isin'][] = [];

    await Promise.allSettled(
      parsedPayload
        .filter(({owner}) => owner === req.user?.id)
        .map(({owner, isin, exchange}) => {
          const record = pb.collection(PocketBaseCollection.STOCK_WATCHLIST).create({
            owner,
            isin,
            exchange,
          });
          addedRecordIds.push(isin);
          return record;
        }),
    );

    if (addedRecordIds.length === 0) {
      return res
        .status(HTTPStatusCode.BadRequest)
        .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('No assets added').build())
        .end();
    }

    const assets = await pb.collection(PocketBaseCollection.STOCK_WATCHLIST).getFullList({
      expand: 'owner,exchange',
    });
    const parsedRecord = z
      .array(
        z.object({
          ...ZAssetWatchlist.shape,
          ...z.object({
            expand: z.object({
              owner: ZUser,
              exchange: ZStockExchange,
            }),
          }).shape,
        }),
      )
      .safeParse(assets);
    if (!parsedRecord.success) throw parsedRecord.error;

    const [quotes, quoteError] = await StockService.getAssets(assets.map(asset => asset.isin));
    if (quoteError) throw quoteError;

    return res
      .status(HTTPStatusCode.Ok)
      .json(
        ApiResponse.builder()
          .withData(
            parsedRecord.data.map((record, idx) => {
              const asset = quotes[idx].asset;
              const quote = quotes[idx].quote;
              const obj: TAssetWatchlistWithQuote = {
                ...record,
                name: asset.name,
                logo: asset.logo,
                wkn: asset.security.wkn,
                quote: quote,
              };
              return obj;
            }),
          )
          .build(),
      )
      .end();
  } catch (error) {
    const err = error as Error;
    logger.error(err.message, {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(err.message).build())
      .end();
  }
});

router.delete('/', async (req, res) => {
  const payload = req.body;
  if (!payload) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing payload').build())
      .end();
  }

  try {
    const parsingResult = z.array(ZDeleteWatchlistAssetPayload).safeParse(payload);
    if (!parsingResult.success) throw parsingResult.error;

    const deletedRecordIds: TDeleteWatchlistAssetPayload['id'][] = [];
    const results = await Promise.allSettled(
      parsingResult.data.map(async ({id}) => {
        try {
          await pb.collection(PocketBaseCollection.STOCK_WATCHLIST).delete(id);
          deletedRecordIds.push(id);
        } catch (error) {
          logger.error(`Was't able to delete asset with id ${id}`, error);
        }
      }),
    );

    const response = ApiResponse.builder()
      .withMessage(`Deleted assets (${deletedRecordIds.map(id => id).join(',')}) from watchlist!`)
      .withData({success: true})
      .build();
    return res.json(response).end();
  } catch (error) {
    const err = error as Error;
    logger.error(err.message, {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(err.message).build())
      .end();
  }
});

export default router;
