import express from 'express';
import {
  ApiResponse,
  HTTPStatusCode,
  PocketBaseCollection,
  type TAddWatchlistAssetPayload,
  type TAssetWatchlistWithQuote,
  type TDeleteWatchlistAssetPayload,
  ZAddWatchlistAssetPayload,
  ZDeleteWatchlistAssetPayload,
  ZStockExchange,
  ZUser,
  ZAssetWatchlist,
} from '@budgetbuddyde/types';
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

// Add a new asset to the watchlist
router.post('/', async (req, res) => {
  const payload = req.body;
  if (!payload) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing payload').build())
      .end();
  }

  try {
    console.log('payload', payload);
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
          console.log('added', isin);
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

// Delete asset from watchlist
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

const a = [
  {
    identifier: 'DE0008404005',
  },
  {
    identifier: 'DE000BASF111',
  },
  {
    identifier: 'DE0007100000',
  },
  {
    identifier: 'DE0007164600',
  },
  {
    identifier: 'US09075V1026',
  },
  {
    identifier: 'DE000BAY0017',
  },
  {
    identifier: 'DE0007664039',
  },
  {
    identifier: 'DE0005552004',
  },
  {
    identifier: 'DE0005557508',
  },
  {
    identifier: 'DE0008232125',
  },
  {
    identifier: 'DE000ENER6Y0',
  },
  {
    identifier: 'DE000A1ML7J1',
  },
  {
    identifier: 'DE0008430026',
  },
  {
    identifier: 'DE000DTR0CK8',
  },
  {
    identifier: 'DE000A0TGJ55',
  },
  {
    identifier: 'DE0007236101',
  },
  {
    identifier: 'DE0007472060',
  },
  {
    identifier: 'DE000ENAG999',
  },
  {
    identifier: 'DE000PAH0038',
  },
  {
    identifier: 'DE0005785604',
  },
  {
    identifier: 'DE000TUAG000',
  },
  {
    identifier: 'DE0006231004',
  },
  {
    identifier: 'DE0007037129',
  },
  {
    identifier: 'DE000A1EWWW0',
  },
  {
    identifier: 'DE0005190003',
  },
  {
    identifier: 'DE0007030009',
  },
  {
    identifier: 'DE000TUAG505',
  },
  {
    identifier: 'DE0005140008',
  },
  {
    identifier: 'DE000PAG9113',
  },
  {
    identifier: 'DE000ZAL1111',
  },
  {
    identifier: 'DE000A2YN900',
  },
  {
    identifier: 'DE0006095003',
  },
  {
    identifier: 'DE0007231334',
  },
  {
    identifier: 'DE000A161408',
  },
  {
    identifier: 'DE000CBK1001',
  },
  {
    identifier: 'DE0005773303',
  },
  {
    identifier: 'DE000SHL1006',
  },
  {
    identifier: 'DE0007500001',
  },
  {
    identifier: 'DE0006062144',
  },
  {
    identifier: 'DE0006047004',
  },
  {
    identifier: 'DE0005493092',
  },
  {
    identifier: 'DE0008019001',
  },
  {
    identifier: 'DE0005158703',
  },
  {
    identifier: 'DE0007231326',
  },
  {
    identifier: 'DE000A0D6554',
  },
  {
    identifier: 'DE0006070006',
  },
  {
    identifier: 'DE000A0Z2ZZ5',
  },
  {
    identifier: 'DE0005190037',
  },
  {
    identifier: 'DE0005313704',
  },
  {
    identifier: 'DE0007664005',
  },
  {
    identifier: 'DE0005664809',
  },
  {
    identifier: 'DE0008402215',
  },
  {
    identifier: 'DE000KSAG888',
  },
  {
    identifier: 'DE000A0WMPJ6',
  },
  {
    identifier: 'DE0006969603',
  },
  {
    identifier: 'DE000A0DJ6J9',
  },
  {
    identifier: 'DE000A0JL9W6',
  },
  {
    identifier: 'DE000PSM7770',
  },
  {
    identifier: 'DE000A2E4K43',
  },
  {
    identifier: 'DE0006599905',
  },
  {
    identifier: 'DE000UNSE018',
  },
  {
    identifier: 'DE000HAG0005',
  },
  {
    identifier: 'DE000A0D9PT0',
  },
  {
    identifier: 'DE000A1J5RX9',
  },
  {
    identifier: 'DE000A11QW68',
  },
  {
    identifier: 'DE000A3CNK42',
  },
  {
    identifier: 'DE000HLAG475',
  },
  {
    identifier: 'DE000DWS1007',
  },
  {
    identifier: 'DE0005810055',
  },
  {
    identifier: 'DE0005659700',
  },
  {
    identifier: 'DE0005785802',
  },
  {
    identifier: 'DE000A1PHFF7',
  },
  {
    identifier: 'DE0006452907',
  },
  {
    identifier: 'DE0007165631',
  },
  {
    identifier: 'DE000A1TNV91',
  },
  {
    identifier: 'DE0006450000',
  },
  {
    identifier: 'DE0006048432',
  },
  {
    identifier: 'DE0007568578',
  },
  {
    identifier: 'DE0005439004',
  },
  {
    identifier: 'DE000SHA0159',
  },
  {
    identifier: 'DE0005470306',
  },
  {
    identifier: 'DE0007461006',
  },
  {
    identifier: 'DE000EVNK013',
  },
  {
    identifier: 'DE000A3E5A59',
  },
  {
    identifier: 'DE000A3H2333',
  },
  {
    identifier: 'DE0005313506',
  },
  {
    identifier: 'DE000A0JK2A8',
  },
  {
    identifier: 'DE000FTG1111',
  },
  {
    identifier: 'DE0006577109',
  },
  {
    identifier: 'DE0006632003',
  },
  {
    identifier: 'DE000A1DAHH0',
  },
  {
    identifier: 'DE000A0LR936',
  },
  {
    identifier: 'DE0008303504',
  },
  {
    identifier: 'DE000SYM9999',
  },
  {
    identifier: 'DE0007276503',
  },
  {
    identifier: 'DE0007314007',
  },
  {
    identifier: 'DE0007165607',
  },
  {
    identifier: 'DE000WAF3001',
  },
  {
    identifier: 'DE0006305006',
  },
  {
    identifier: 'DE000TLX1005',
  },
];
