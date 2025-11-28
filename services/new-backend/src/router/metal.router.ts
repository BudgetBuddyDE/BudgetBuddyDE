import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {config} from '../config';
import {logger as MainLogger, MetalCache} from '../lib';
import {MetalPriceAPI, type SuccessMetalQuoteResponse} from '../lib/services';
import {ApiResponse, HTTPStatusCode} from '../models';

export const metalRouter = Router();

export const MetalSymbol = z.enum(['XPT', 'XAU', 'XAG']);
export type TMetalSymbol = z.infer<typeof MetalSymbol>;

type MetalResponse<Symbols extends string> = Record<
  Symbols,
  {eur: number; usd: number; name: string; unit: string; symbol: Symbols}
>;

const logger = MainLogger.child({label: 'MetalRouter'});

metalRouter.get(
  '/:symbol',
  validateRequest({
    params: z.object({
      symbol: MetalSymbol,
    }),
  }),
  async (req, res) => {
    const {symbol} = req.params;

    if (!config.metal.symbols[symbol]) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage(`Metal symbol ${symbol} is not configured`)
        .buildAndSend(res);
    }

    const cache = new MetalCache();
    const cachedValue = await cache.get(symbol);
    if (cachedValue) {
      logger.debug(`Metal price for ${symbol} served from cache`);
      return ApiResponse.builder<MetalResponse<string>>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage(`Fetched metal price for ${symbol} from cache`)
        .withData({
          [symbol]: {
            eur: cachedValue.EUR,
            usd: cachedValue.USD,
            name: config.metal.symbols[symbol].name,
            unit: config.metal.symbols[symbol].unit,
            symbol: symbol,
          },
        })
        .withFrom('cache')
        .buildAndSend(res);
    }

    try {
      const price = await MetalPriceAPI.getPrice(symbol);
      if (!price || !price.success) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
          .withMessage(`Failed to fetch metal price for ${symbol}`)
          .buildAndSend(res);
      }

      await cache.set(symbol, price.rates);
      logger.debug(`Metal price for ${symbol} fetched from API and cached`);

      ApiResponse.builder<MetalResponse<string>>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage(`Fetched metal price for ${symbol} from API`)
        .withData({
          [symbol]: {
            eur: price.rates.EUR,
            usd: price.rates.USD,
            name: config.metal.symbols[symbol].name,
            unit: config.metal.symbols[symbol].unit,
            symbol: symbol,
          },
        })
        .withFrom('external')
        .buildAndSend(res);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      ApiResponse.builder().fromError(error, false).withFrom('external').buildAndSend(res);
    }
  },
);

metalRouter.get('/', async (_req, res) => {
  const symbols = Object.keys(config.metal.symbols) as TMetalSymbol[];
  if (symbols.length === 0) {
    ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('No metal symbols configured')
      .withData(symbols)
      .buildAndSend(res);
    return;
  }

  const prices = new Map<TMetalSymbol, SuccessMetalQuoteResponse<string>['rates']>();
  const cache = new MetalCache();
  await Promise.all(
    symbols.map(async symbol => {
      const CacheServicedValue = await cache.get(symbol);
      if (CacheServicedValue) {
        logger.debug(`Metal price for ${symbol} served from cache`);
        prices.set(symbol, CacheServicedValue);
        return true;
      }
      const price = await MetalPriceAPI.getPrice(symbol);
      if (!price || !price.success) return false;
      await cache.set(symbol, price.rates);
      logger.debug(`Metal price for ${symbol} fetched from API and cached`);
      prices.set(symbol, price.rates);
      return true;
    }),
  );

  ApiResponse.builder<MetalResponse<string>>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage('Fetched metal prices successfully')
    .withData({
      ...Array.from(prices.entries()).reduce(
        (acc, [symbol, rates]) => {
          acc[symbol] = {
            eur: rates.EUR,
            usd: rates.USD,
            name: config.metal.symbols[symbol].name,
            unit: config.metal.symbols[symbol].unit,
            symbol: symbol,
          };
          return acc;
        },
        {} as MetalResponse<string>,
      ),
    })
    .withFrom('external')
    .buildAndSend(res);
});
