import {
  ApiResponse,
  type TAddWatchlistAssetPayload,
  type TApiResponse,
  type TAssetChartQuote,
  type TAssetDetails,
  type TAssetSearchResult,
  type TAssetWatchlistWithQuote,
  type TCreateStockPositionPayload,
  type TDeleteWatchlistAssetPayload,
  type TDividendDetailList,
  type TDividendDetails,
  type TId,
  type TIsin,
  type TRelatedStockWithQuotes,
  type TServiceResponse,
  type TStockExchange,
  type TStockPositionWithQuote,
  type TStockQuote,
  type TTimeframe,
  type TUpdateStockPositionPayload,
  ZAssetChartQuote,
  ZAssetDetails,
  ZAssetSearchResult,
  ZAssetWatchlistWithQuote,
  ZDividendDetails,
  ZRelatedStockWithQuotes,
  ZStockExchange,
  ZStockPositionWithQuote,
  ZStockQuote,
} from '@budgetbuddyde/types';
import {z} from 'zod';

import {preparePockebaseRequestOptions} from '@/utils';
import {isRunningInProdEnv} from '@/utils';

/**
 * The StockService class provides methods for interacting with stock-related data and services.
 */
export class StockService {
  private static host = isRunningInProdEnv() ? (process.env.STOCK_SERVICE_HOST as string) : '/stock_service';

  /**
   * Transforms an array of dividend details into a new array of transformed dividend objects.
   * @param dividends - An array of dividend details.
   * @returns An array of transformed dividend objects.
   */
  static transformDividendDetails(dividends: TDividendDetails[]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Object.entries(dividends).flatMap(([_, data]) => {
      const companyInfo = data.asset;
      const upcomingDividends = data.futureDividends;
      if (!upcomingDividends) return [];
      return upcomingDividends
        .map(
          ({date, currency, exDate, isEstimated, paymentDate, price, originalCurrency, originalPrice, type}, index) => {
            return {
              companyInfo,
              dividend: {
                currency,
                exDate,
                isEstimated,
                paymentDate,
                price,
                originalCurrency,
                originalPrice,
                type,
              },
              key: `${date}-${index}`,
            };
          },
        )
        .reverse();
    });
  }

  /**
   * Retrieves asset details for a given ISIN.
   * @param isin - The ISIN of the asset.
   * @returns A promise that resolves to a tuple containing the asset details and any error that occurred during the retrieval.
   */
  static async getAssetDetails(isin: string): Promise<TServiceResponse<TAssetDetails>> {
    try {
      const response = await fetch(`${this.host}/v1/asset/details/${isin}`, {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TAssetDetails>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = ZAssetDetails.safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves open positions for a given stock.
   *
   * @param payload - The payload containing information about the stock position.
   * @returns A promise that resolves to a tuple containing the stock positions with quotes and an error, if any.
   */
  static async openPositions(
    payload: TCreateStockPositionPayload,
  ): Promise<TServiceResponse<TStockPositionWithQuote[]>> {
    try {
      const response = await fetch(this.host + '/v1/asset/position', {
        method: 'POST',
        body: JSON.stringify(payload),
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TStockPositionWithQuote[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZStockPositionWithQuote).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves the positions of stocks with quotes.
   * @returns A promise that resolves to a tuple containing the stock positions with quotes and an error, if any.
   */
  static async getPositions(): Promise<TServiceResponse<TStockPositionWithQuote[]>> {
    try {
      const response = await fetch(this.host + '/v1/asset/position', {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TStockPositionWithQuote[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZStockPositionWithQuote).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Updates the positions of stocks.
   *
   * @param payload - The payload containing the updated stock positions.
   * @returns A promise that resolves to a tuple containing the updated stock positions and an error, if any.
   */
  static async updatePositions(
    payload: TUpdateStockPositionPayload,
  ): Promise<TServiceResponse<TStockPositionWithQuote[]>> {
    try {
      const response = await fetch(this.host + '/v1/asset/position', {
        method: 'PUT',
        body: JSON.stringify(payload),
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TStockPositionWithQuote[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZStockPositionWithQuote).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Deletes a position with the specified ID.
   *
   * @param payload - The payload containing the ID of the position to delete.
   * @returns A promise that resolves to a tuple containing the response data and any error that occurred.
   */
  static async deletePosition(payload: {id: TId}): Promise<TServiceResponse<{success: boolean}>> {
    try {
      const response = await fetch(this.host + '/v1/asset/position/', {
        method: 'DELETE',
        body: JSON.stringify(payload),
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<{success: boolean}>;
      if (json.status != 200 || (json.data && !json.data.success)) {
        return [null, new Error(json.message!)];
      }

      const parsingResult = z.object({success: z.boolean()}).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves a stock quote for a given asset and exchange.
   * @param asset - The asset symbol.
   * @param exchange - The exchange symbol.
   * @returns A promise that resolves to a tuple containing the stock quote data and any error that occurred during the request.
   */
  static async getQuote(asset: string, exchange: string): Promise<TServiceResponse<TStockQuote>> {
    try {
      const query = new URLSearchParams();
      query.append('asset', asset);
      query.append('exchange', exchange);

      const response = await fetch(this.host + '/v1/asset/quote?' + query.toString(), {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TStockQuote>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = ZStockQuote.safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves quotes for multiple assets from the specified exchange and timeframe.
   *
   * @param assets - An array of asset symbols.
   * @param exchange - The exchange from which to retrieve the quotes.
   * @param timeframe - The timeframe for the quotes.
   * @returns A promise that resolves to a tuple containing the quotes and any error that occurred.
   */
  static async getQuotes(
    assets: string[],
    exchange: string,
    timeframe: TTimeframe,
  ): Promise<TServiceResponse<TAssetChartQuote[]>> {
    try {
      const query = new URLSearchParams();
      assets.forEach(asset => query.append('assets', asset));
      query.append('exchange', exchange);
      query.append('timeframe', timeframe);

      const response = await fetch(this.host + '/v1/asset/quotes?' + query.toString(), {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as ApiResponse<TAssetChartQuote[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZAssetChartQuote).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Searches for an asset based on the provided term.
   * @param term - The search term.
   * @returns A promise that resolves to a tuple containing the search results and any error that occurred during the search.
   */
  static async searchAsset(term: string): Promise<TServiceResponse<TAssetSearchResult[]>> {
    try {
      const query = new URLSearchParams();
      query.append('q', term);

      const response = await fetch(`${this.host}/v1/asset/search?${query.toString()}`, {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TAssetSearchResult[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZAssetSearchResult).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves a list of stock exchanges.
   * @returns A promise that resolves to a tuple containing the list of stock exchanges and any potential error.
   */
  static async getExchanges(): Promise<TServiceResponse<TStockExchange[]>> {
    try {
      const response = await fetch(this.host + '/v1/asset/exchanges', {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TStockExchange[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZStockExchange).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves dividend details for the specified assets.
   * @param assets - An array of asset names.
   * @returns A promise that resolves to a tuple containing the dividend details and any error that occurred during the request.
   */
  static async getDividends(assets: string[]): Promise<TServiceResponse<TDividendDetailList['dividendDetails']>> {
    try {
      const query = new URLSearchParams();
      assets.forEach(asset => query.append('assets', asset));

      const response = await fetch(this.host + '/v1/dividend?' + query.toString(), {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TDividendDetailList['dividendDetails']>;
      if (json.status != 200) return [null, new Error('Something went wrong')];

      const parsingResult = z.record(ZDividendDetails).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves related stocks with quotes based on the provided ISIN.
   * @param isin - The ISIN (International Securities Identification Number) of the stock.
   * @param amount - The number of related stocks to retrieve (default: 8).
   * @returns A promise that resolves to a tuple containing the related stocks with quotes and any potential error.
   */
  static async getRelatedStocks(isin: TIsin, amount = 8): Promise<TServiceResponse<TRelatedStockWithQuotes[]>> {
    try {
      const query = new URLSearchParams();
      query.append('limit', amount + '');

      const response = await fetch(`${this.host}/v1/asset/details/${isin}/related?${query.toString()}`, {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TRelatedStockWithQuotes[]>;
      if (json.status != 200) return [null, new Error('Something went wrong')];

      const parsingResult = z.array(ZRelatedStockWithQuotes).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves the watchlist of assets with quotes.
   * @returns A promise that resolves to a tuple containing the watchlist data and an error, if any.
   */
  static async getWatchlist(): Promise<TServiceResponse<TAssetWatchlistWithQuote[]>> {
    try {
      const response = await fetch(this.host + '/v1/asset/watchlist', {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TAssetWatchlistWithQuote[]>;
      if (json.status != 200) return [null, new Error(json.message!)];
      const parsingResult = z.array(ZAssetWatchlistWithQuote).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Adds an asset to the watchlist.
   *
   * @param payload - The payload containing the asset information.
   * @returns A promise that resolves to a tuple containing the watchlist with quotes and an error, if any.
   */
  static async addAssetToWatchlist(
    payload: TAddWatchlistAssetPayload,
  ): Promise<TServiceResponse<TAssetWatchlistWithQuote[]>> {
    try {
      const response = await fetch(this.host + '/v1/asset/watchlist', {
        method: 'POST',
        body: JSON.stringify([payload]),
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TAssetWatchlistWithQuote[]>;
      if (json.status != 200) return [null, new Error(json.message!)];
      const parsingResult = z.array(ZAssetWatchlistWithQuote).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Deletes an asset from the watchlist.
   *
   * @param payload - The payload containing the asset information to be deleted.
   * @returns A promise that resolves to a tuple containing the response data and any error that occurred.
   */
  static async deleteAssetFromWatchlist(payload: TDeleteWatchlistAssetPayload): Promise<TServiceResponse<boolean>> {
    try {
      const response = await fetch(this.host + '/v1/asset/watchlist', {
        method: 'DELETE',
        body: JSON.stringify([payload]),
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<{success: boolean}>;
      if (json.status != 200) return [null, new Error(json.message!)];
      return [json.data ? json.data.success : false, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
