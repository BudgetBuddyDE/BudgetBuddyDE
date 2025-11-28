import {AssetIdentifier, type ParqetSchemas, Timeframe} from '@budgetbuddyde/types';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {logger} from '../lib';
import {AssetCache} from '../lib/cache/asset.cache';
import {Parqet} from '../lib/services';
import {ApiResponse, HTTPStatusCode} from '../models';

export const assetRouter = Router();

assetRouter.get(
  '/search',
  validateRequest({
    query: z.object({
      query: z.string().min(1),
    }),
  }),
  async (req, res) => {
    const searchTerm = req.query.query;
    logger.debug(`SearchAssets: Searching for assets with term "${searchTerm}"`);

    const assetCache = new AssetCache();
    const cachedResults = await assetCache.getCachedAssetSearchResults(searchTerm);
    if (cachedResults) {
      return ApiResponse.builder<typeof cachedResults>()
        .withMessage(`Found ${cachedResults.length ?? 0} assets for query "${searchTerm}"`)
        .withData(cachedResults)
        .withFrom('cache')
        .buildAndSend(res);
    }

    const [searchResults, error] = await Parqet.search(searchTerm);
    if (error) {
      logger.error(`Error searching for assets with term "${searchTerm}": ${error.message}`);
      return ApiResponse.builder().fromError(error).buildAndSend(res);
    }

    const results = searchResults?.map(result => ({
      identifier: result.assetId.identifier,
      name: result.name,
      assetType: result.assetId.assetType,
      // On securities, the logo can be undefined under the "asset"-node but when handling a commodity, the logo should always be present
      logoUrl: result.assetType === 'Security' ? result.security.logo : result.asset.logo,
    }));

    await assetCache.cacheAssetSearchResults(searchTerm, results);

    ApiResponse.builder<typeof results>()
      .withMessage(`Found ${results?.length ?? 0} assets for query "${searchTerm}"`)
      .withData(results)
      .withFrom('external')
      .buildAndSend(res);
  },
);

assetRouter.get(
  '/related/:identifier',
  validateRequest({
    params: z.object({
      identifier: AssetIdentifier,
    }),
    query: z.object({
      $expand: z.enum(['quotes']).optional(),
      limit: z.coerce.number().default(6),
    }),
  }),
  async (req, res) => {
    const {identifier} = req.params;
    const {limit, $expand} = req.query;

    // Check if related assets are cached
    const assetCache = new AssetCache();
    let relatedAssets = [] as z.infer<typeof ParqetSchemas.RelatedAsset>[];
    const cachedRelatedAssets = await assetCache.getRelatedAssets(identifier, limit);
    if (!cachedRelatedAssets) {
      const [assets, err] = await Parqet.getRelatedAssets(identifier, limit);
      if (err) {
        return ApiResponse.builder().fromError(err).buildAndSend(res);
      }
      await assetCache.setRelatedAssets(identifier, limit, assets);
      relatedAssets = assets;
    } else relatedAssets = cachedRelatedAssets;

    type AssetQuote = {
      identifier: string;
      date: Date;
      currency: string;
      price: number;
    };
    const assetQuoteMap = new Map<string, AssetQuote[]>();
    const shouldExpandQuotes = $expand && $expand === 'quotes';
    if (shouldExpandQuotes) {
      logger.debug('Fetching quotes for related assets as they were requested via $expand=quotes', req.query);
      const [quotes, err] = await Parqet.getQuotes(
        relatedAssets.map(({asset}) => ({
          identifier: asset._id.identifier,
        })),
        '1m',
      );
      if (err) {
        logger.error('Error fetching quotes for related assets', err);
        return ApiResponse.builder().fromError(err).buildAndSend(res);
      }

      for (const [identifier, details] of quotes.entries()) {
        const currency = details.currency;
        const relatedAssetQuotes = details.quotes.map(quote => ({
          identifier: identifier,
          date: quote.date,
          currency: currency,
          price: quote.price,
        }));
        assetQuoteMap.set(identifier, relatedAssetQuotes);
      }
    }

    const expandedRelatedAssets = relatedAssets.map(({asset}) => {
      const identifier = asset._id.identifier;
      const securityType =
        asset.assetType === 'Security' ? asset.security.type : asset.assetType === 'Crypto' ? 'Crypto' : 'Commodity';

      const assetObj = {
        identifier: identifier,
        assetType: asset.assetType,
        securityName: asset.name,
        securityType,
        logoUrl: asset.logo,
      } as {
        identifier: string;
        assetType: string;
        securityName: string;
        securityType: string;
        logoUrl: string;
        quotes?: AssetQuote[];
      };

      if (shouldExpandQuotes) {
        assetObj.quotes = assetQuoteMap.get(identifier) || [];
      }

      return assetObj;
    });

    return ApiResponse.builder<typeof expandedRelatedAssets>()
      .withMessage(
        shouldExpandQuotes
          ? `Fetched related assets with quotes for '${identifier}' successfully`
          : `Fetched related assets for '${identifier}' successfully`,
      )
      .withData(expandedRelatedAssets)
      .withFrom('external')
      .buildAndSend(res);
  },
);

assetRouter.get(
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

assetRouter.get(
  '/quotes',
  validateRequest({
    query: z.object({
      identifier: AssetIdentifier,
      timeframe: Timeframe,
      currency: z.string().length(3).toUpperCase().default('EUR'),
    }),
  }),
  async (req, res) => {
    const {identifier, timeframe, currency} = req.query;
    const [quotes, err] = await Parqet.getQuotes([{identifier}], timeframe, currency);
    if (err) {
      return ApiResponse.builder().fromError(err).buildAndSend(res);
    }

    const _quotes = Array.from(quotes.entries()).map(([identifier, details]) => {
      return {
        identifier: identifier,
        from: details.interval.from,
        to: details.interval.to,
        timeframe: details.interval.timeframe,
        exchange: details.exchange,
        currency: details.currency,
        quotes: details.quotes,
      };
    });

    ApiResponse.builder<typeof _quotes>()
      .withMessage(`Fetched quotes for '${identifier}' successfully`)
      .withData(_quotes)
      .withFrom('external')
      .buildAndSend(res);
  },
);

assetRouter.get(
  '/dividends',
  validateRequest({
    query: z.object({
      identifier: AssetIdentifier.or(z.array(AssetIdentifier)),
      future: z.coerce.boolean().default(false),
      historical: z.coerce.boolean().default(true),
    }),
  }),
  async (req, res) => {
    const {identifier, future, historical} = req.query;
    if (!historical && !future) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.UNPROCESSABLE_ENTITY)
        .withMessage("At least one of 'historical' or 'future' must be true")
        .buildAndSend(res);
    }
    const identifiers = Array.isArray(identifier) ? identifier : [identifier];
    const [fetchedDividends, err] = await Parqet.getDividends(
      identifiers.map(identifier => ({identifier})),
      {future, historical},
    );
    if (err) {
      return ApiResponse.builder().fromError(err).buildAndSend(res);
    }

    const mergedDividends = Object.entries(fetchedDividends.dividendDetails).flatMap(([, details]) => {
      const mergedDividends = [...(details.futureDividends || []), ...(details.historicalDividends || [])];
      return mergedDividends.flatMap(dividend => ({
        identifier: details.identifier,
        payoutInterval: details.payoutInterval,
        price: dividend.price,
        currency: dividend.currency,
        date: dividend.date,
        datetime: dividend.datetime,
        paymentDate: dividend.paymentDate,
        recordDate: dividend.recordDate,
        exDate: dividend.exDate,
        isEstimated: dividend.isEstimated,
      }));
    });

    mergedDividends.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

    ApiResponse.builder<typeof mergedDividends>()
      .withMessage(`Fetched dividends for ${identifier.length} assets successfully`)
      .withData(mergedDividends)
      .withFrom('external')
      .buildAndSend(res);
  },
);
