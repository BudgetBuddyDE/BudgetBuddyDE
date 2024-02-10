import {z} from 'zod';
import express from 'express';
import {ApiResponse, HTTPStatusCode, type TApiResponse} from '@budgetbuddyde/types';
import {StockService, DatabaseService} from '../services';
import {
  type TSearchEntity,
  ZOpenPositionPayload,
  ZClosePositionPayload,
  ZUpdatePositionPayload,
  type TStockServiceResponse,
} from '../types';
import {ZTimeframe} from '../types/StockService.types';

const router = express.Router();

router.get('/search', async (req, res) => {
  if (!req.query.q) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage('Missing search term').build())
      .end();
  }

  const [matches, error] = await StockService.searchAsset(req.query.q as string);
  if (error) {
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
      };
    })
    .filter(match => match !== null) as TSearchEntity[];

  const response: TStockServiceResponse<'GET_SearchAsset'> = ApiResponse.builder<TSearchEntity[]>()
    .withData(searchResults)
    .build() as TApiResponse<TSearchEntity[]>;
  return res.json(response).end();
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
    const parsingResult = z.array(ZOpenPositionPayload).safeParse(payload);
    if (!parsingResult.success) throw new Error(parsingResult.error.message);
    const [saveResult, error] = await DatabaseService.createPosition(
      parsingResult.data.filter(({owner}) => owner === req.user?.uuid),
    );
    if (error) throw error;

    const [quotes, quoteError] = await StockService.getAssets(saveResult.map(entry => entry.isin));
    if (quoteError) throw quoteError;

    const response = ApiResponse.builder()
      .withMessage(`Opened position for ${parsingResult.data.map(entry => entry.isin).join(',')}!`)
      .withData(
        saveResult.map((position, index) => {
          const asset = quotes[index].asset;
          const quote = quotes[index].quote;
          return {
            ...position,
            name: asset.name,
            logo: asset.logo,
            volume: quote.price * position.quantity,
            quote: quote,
          };
        }),
      )
      .build() as TStockServiceResponse<'POST_OpenPosition'>;
    return res.json(response).end();
  } catch (error) {
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

router.get('/position', async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('Unauthorized').build())
      .end();
  }

  try {
    const [positions, error] = await DatabaseService.getPositionsByOwner({uuid: user.uuid});
    if (error) throw error;

    const isins = positions.map(position => position.isin);
    const [quotes, quoteError] = await StockService.getAssets(isins);
    if (quoteError) throw quoteError;

    if (positions.length !== quotes.length) {
      throw new Error('Mismatch between positions and quotes');
    }

    const response = ApiResponse.builder()
      .withData(
        positions.map((position, index) => {
          const asset = quotes[index].asset;
          const quote = quotes[index].quote;
          return {
            ...position,
            name: asset.name,
            logo: asset.logo,
            volume: quote.price * position.quantity,
            quote: quote,
          };
        }),
      )
      .build() as TStockServiceResponse<'GET_Position'>;
    return res.json(response).end();
  } catch (error) {
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
    const parsingResult = z.array(ZUpdatePositionPayload).safeParse(payload);
    if (!parsingResult.success) throw new Error(parsingResult.error.message);

    const [updateResult, error] = await DatabaseService.updatePosition(parsingResult.data, req.user);
    if (error) throw error;

    const response = ApiResponse.builder()
      .withMessage(`Updated position for ${parsingResult.data.map(entry => entry.id).join(',')}!`)
      .withData(updateResult)
      .build() as TStockServiceResponse<'PUT_UpdatePosition'>;
    return res.json(response).end();
  } catch (error) {
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
    const parsingResult = z.array(ZClosePositionPayload).safeParse(payload);
    if (!parsingResult.success) throw new Error(parsingResult.error.message);

    const [deleteResult, error] = await DatabaseService.deletePositions(parsingResult.data, req.user);
    if (error) throw error;

    const response = ApiResponse.builder()
      .withMessage(`Closed position for ${parsingResult.data.map(entry => entry.id).join(',')}!`)
      .withData(deleteResult)
      .build() as TStockServiceResponse<'DELETE_ClosePosition'>;
    return res.json(response).end();
  } catch (error) {
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

router.get('/quote', async (req, res) => {
  const query = req.query;
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
  }

  const asset = query.asset as string;
  const [quote, error] = await StockService.getQuote({
    isin: asset,
    exchange: 'langschwarz',
  });
  if (error) {
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
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build());
  }
  return res.json(ApiResponse.builder().withData(quotes).build());
});

export default router;
