import {
  ApiResponse,
  HTTPStatusCode,
  PocketBaseCollection,
  type TAssetSearchResult,
  type TStockPosition,
  type TStockPositionWithQuote,
  ZCreateStockPositionPayload,
  ZId,
  ZStockPosition,
  ZTimeframe,
  ZUpdateStockPositionPayload,
} from '@budgetbuddyde/types';
import express from 'express';
import {promise, z} from 'zod';

import {logger} from '../logger';
import {CountryMapping, IndustryMapping, RegionMapping, SectorMapping} from '../mappings';
import {pb} from '../pocketbase';
import {StockService} from '../services';

const router = express.Router();

router.get('/exchanges', async (req, res) => {
  try {
    const exchanges = await pb.collection(PocketBaseCollection.STOCK_EXCHANGE).getFullList();
    return res.json(ApiResponse.builder().withData(exchanges).build()).end();
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

router.get('/search', async (req, res) => {
  if (!req.query.q) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing search term').build())
      .end();
  }

  const [matches, error] = await StockService.searchAsset(req.query.q as string);
  if (error) {
    logger.error(error.message, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build())
      .end();
  }

  const searchResults = matches
    .map(match => {
      if (match.assetType === 'crypto') return null;
      return {
        type: match.asset.security.type,
        name: match.name,
        identifier: match.assetId.identifier,
        logo: match.asset.logo,
        domicil: match.asset.security.etfDomicile,
        wkn: match.asset.security.wkn,
        website: match.asset.security.website,
      };
    })
    .filter(match => match !== null) as TAssetSearchResult[];

  const response = ApiResponse.builder<TAssetSearchResult[]>().withData(searchResults).build();
  return res.json(response).end();
});

router.get('/details/:isin', async (req, res) => {
  const isin = req.params.isin;
  if (!isin) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing ISIN').build())
      .end();
  }

  const [details, error] = await StockService.getAssetDetails(isin);
  if (error) {
    logger.error(error.message, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build())
      .end();
  }

  return res.json(ApiResponse.builder().withData(details).build()).end();
});

router.get('/details/:isin/related', async (req, res) => {
  try {
    const limit = (req.query.limit as unknown as number) ?? 8;
    const [relatedStocks, error] = await StockService.getRelatedStocks(req.params.isin, limit);
    if (error) throw error;
    if (!relatedStocks) throw new Error('No related stocks found');

    const isins: string[] = relatedStocks
      .filter(stock => stock.asset.security)
      .map(stock => stock.asset.security!.isin);
    const [quotes, quotesError] = await StockService.getQuotes(
      isins.map(isin => ({isin, exchange: 'langschwarz'})),
      '1m',
    );
    if (quotesError) throw quotesError;
    if (!quotes) throw new Error('No quotes found');

    return res
      .status(HTTPStatusCode.Ok)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.Ok)
          .withData(
            relatedStocks.map(stock => {
              const stockQuotes = quotes!.find(quote => quote.assetIdentifier === stock.asset._id.identifier);
              if (!stockQuotes) return;
              return {
                ...stock,
                quotes: stockQuotes.quotes.map(quote => ({
                  ...quote,
                  exchange: stockQuotes.exchange,
                  currency: stockQuotes.currency,
                })),
              };
            }),
          )
          .build(),
      )
      .end();
  } catch (error) {
    logger.error('Something went wrong', error);
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.InternalServerError)
          .withMessage((error as Error).message)
          .build(),
      )
      .end();
  }
});

router.post('/position', async (req, res) => {
  if (!req.user) {
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('Unauthorized').build())
      .end();
  }

  const payload = req.body;
  if (!payload) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing payload').build())
      .end();
  }

  try {
    const parsingResult = ZCreateStockPositionPayload.safeParse(payload);
    if (!parsingResult.success) throw parsingResult.error;

    const createdRecord = await pb.collection(PocketBaseCollection.STOCK_POSITION).create(parsingResult.data);
    const expandedCreatedRecord = await pb.collection(PocketBaseCollection.STOCK_POSITION).getOne(createdRecord.id, {
      expand: 'exchange',
    });
    const parsedRecord = ZStockPosition.safeParse(expandedCreatedRecord);
    if (!parsedRecord.success) throw parsedRecord.error;

    const [quotes, quoteError] = await StockService.getAssets([parsedRecord.data.isin]);
    if (quoteError) throw quoteError;
    if (!quotes) throw new Error('No quotes found for the given ISINs.');

    const response = ApiResponse.builder()
      .withMessage(`Opened position for ${[parsingResult.data].map(entry => entry.isin).join(',')}!`)
      .withData(
        [parsedRecord.data].map((position, index) => {
          const matchingQuote = quotes.find(quote => quote.asset._id.identifier === position.isin);
          if (!matchingQuote) throw new Error(`No quote found for ISIN ${position.isin}`);
          const asset = matchingQuote.asset;
          const quote = matchingQuote.quote;
          const obj: TStockPositionWithQuote = {
            ...position,
            name: asset.name,
            logo: asset.logo,
            wkn: asset.security.wkn,
            volume: quote.price * position.quantity,
            quote: quote,
          };
          return obj;
        }),
      )
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

router.get('/position', async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('Unauthorized').build())
      .end();
  }

  try {
    const records = await pb.collection(PocketBaseCollection.STOCK_POSITION).getFullList({
      expand: 'exchange',
      filter: pb.filter('owner = {:userId}', {userId: req.user?.id}),
    });
    const parsedRecord = z.array(ZStockPosition).safeParse(records);
    if (!parsedRecord.success) throw parsedRecord.error;
    const parsedPositions = parsedRecord.data as TStockPosition[];

    const isins = parsedPositions.map(({isin}) => isin);
    const [quotes, quoteError] = await StockService.getAssets(isins);
    if (quoteError) throw quoteError;
    if (!quotes) throw new Error('No quotes found for the given ISINs.');

    if (parsedPositions.length !== quotes.length) {
      throw new Error('Mismatch between positions and quotes');
    }

    const response = ApiResponse.builder()
      .withData(
        parsedPositions.map((position, index) => {
          const matchingQuote = quotes.find(quote => quote.asset._id.identifier === position.isin);
          if (!matchingQuote) throw new Error(`No quote found for ISIN ${position.isin}`);
          const asset = matchingQuote.asset;
          const quote = matchingQuote.quote;
          const obj: TStockPositionWithQuote = {
            ...position,
            name: asset.name,
            logo: asset.logo,
            wkn: asset.security.wkn,
            volume: quote.price * position.quantity,
            quote: quote,
          };
          return obj;
        }),
      )
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

(['country', 'industry', 'sector', 'region', 'type'] as const).forEach(distinction =>
  router.get(`/position/allocation/${distinction}`, async (req, res) => {
    const user = req.user;
    if (!user) {
      return res
        .status(HTTPStatusCode.Unauthorized)
        .json(ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('Unauthorized').build())
        .end();
    }

    try {
      const records = await pb.collection(PocketBaseCollection.STOCK_POSITION).getFullList({
        expand: 'exchange',
        filter: pb.filter('owner = {:userId}', {userId: req.user?.id}),
      });
      const parsedRecord = z.array(ZStockPosition).safeParse(records);
      if (!parsedRecord.success) throw parsedRecord.error;
      const parsedPositions = parsedRecord.data as TStockPosition[];

      const isinList: Pick<TStockPosition, 'isin' | 'currency'>[] = parsedPositions.map(({isin, currency}) => ({
        isin,
        currency,
      }));

      const promises = await Promise.all(
        isinList.map(({isin, currency}) => StockService.getAssetDetails(isin, currency)),
      );

      let data: any = parsedPositions;

      switch (distinction) {
        case 'country':
          console.log(CountryMapping);
          break;
        case 'industry':
          console.log(IndustryMapping);
          break;
        case 'region':
          console.log(RegionMapping);
          break;
        case 'sector':
          console.log(SectorMapping);
          const shares = promises.filter(([details, err]) => !err && details.asset.security.type === 'Aktie');
          console.dir(shares[1][0]);
          data = shares.map(([details, _]) => details?.asset);
          break;
      }

      return res
        .status(HTTPStatusCode.InternalServerError)
        .json(
          ApiResponse.builder()
            .withStatus(HTTPStatusCode.InternalServerError)
            .withMessage(distinction)
            .withData(data)
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
  }),
);

router.put('/position', async (req, res) => {
  if (!req.user) {
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('Unauthorized').build())
      .end();
  }

  const payload = req.body;
  if (!payload) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing payload').build())
      .end();
  }

  try {
    const parsingResult = ZUpdateStockPositionPayload.safeParse(payload);
    if (!parsingResult.success) throw parsingResult.error;
    const parsedPayload = parsingResult.data;

    await pb.collection(PocketBaseCollection.STOCK_POSITION).update(parsedPayload.id, parsingResult.data);
    const expandedUpdatedRecord = await pb.collection(PocketBaseCollection.STOCK_POSITION).getOne(parsedPayload.id, {
      expand: 'exchange',
    });
    const parsedRecord = ZStockPosition.safeParse(expandedUpdatedRecord);
    if (!parsedRecord.success) throw parsedRecord.error;

    const [quotes, quoteError] = await StockService.getAssets([parsedRecord.data.isin]);
    if (quoteError) throw quoteError;

    const response = ApiResponse.builder()
      .withMessage(`Updated position for ${[parsingResult.data].map(entry => entry.isin).join(',')}!`)
      .withData(
        [parsedRecord.data].map((position, index) => {
          const matchingQuote = quotes.find(quote => quote.asset._id.identifier === position.isin);
          if (!matchingQuote) throw new Error(`No quote found for ISIN ${position.isin}`);
          const asset = matchingQuote.asset;
          const quote = matchingQuote.quote;
          const obj: TStockPositionWithQuote = {
            ...position,
            name: asset.name,
            logo: asset.logo,
            wkn: asset.security.wkn,
            volume: quote.price * position.quantity,
            quote: quote,
          };
          return obj;
        }),
      )
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

router.delete('/position', async (req, res) => {
  if (!req.user) {
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('Unauthorized').build())
      .end();
  }

  const payload = req.body;
  if (!payload) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing payload').build())
      .end();
  }

  try {
    const parsingResult = z.object({id: ZId}).safeParse(payload);
    if (!parsingResult.success) throw parsingResult.error;

    await pb.collection(PocketBaseCollection.STOCK_POSITION).delete(parsingResult.data.id);

    const response = ApiResponse.builder()
      .withMessage(`Closed position for ${[parsingResult.data].map(id => id).join(',')}!`)
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

router.get('/quote', async (req, res) => {
  const query = req.query;
  const exchange = query.exchange;
  if (!query || !query.asset) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage("Missing 'asset' query parameter")
          .build(),
      );
  } else if (!z.string().safeParse(query.asset).success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage("Invalid 'asset' provided").build(),
      );
  } else if (!exchange) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage("Missing 'exchange' query parameter")
          .build(),
      );
  } else if (!z.string().safeParse(exchange).success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage("Invalid 'exchange' provided").build(),
      );
  }

  const asset = query.asset as string;
  const [quote, error] = await StockService.getQuote({
    isin: asset,
    exchange: exchange as string,
  });
  if (error) {
    logger.error(error.message, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build());
  }
  return res.json(ApiResponse.builder().withData(quote).build());
});

router.get('/quotes', async (req, res) => {
  const query = req.query;
  const exchange = query.exchange;
  if (!query || !query.assets) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage("Missing 'assets' query parameter")
          .build(),
      );
  } else if (!z.array(z.string()).or(z.string()).safeParse(query.assets).success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage("Invalid 'assets' provided").build(),
      );
  } else if (!exchange) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage("Missing 'exchange' query parameter")
          .build(),
      );
  } else if (!z.string().safeParse(exchange).success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage("Invalid 'exchange' provided").build(),
      );
  }

  const timeframe = req.query.timeframe,
    parsedTimeframe = ZTimeframe.safeParse(timeframe);

  const assets = (Array.isArray(query.assets) ? query.assets : [query.assets]) as string[];
  const [quotes, error] = await StockService.getQuotes(
    assets.map(isin => ({isin, exchange: exchange as string})),
    parsedTimeframe.success ? parsedTimeframe.data : '1d',
  );
  if (error) {
    logger.error(error.message, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build());
  }
  return res.json(ApiResponse.builder().withData(quotes).build());
});

export default router;
