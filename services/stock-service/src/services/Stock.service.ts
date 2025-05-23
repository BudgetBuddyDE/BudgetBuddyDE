import {
  type TApiResponse,
  type TAssetChartQuote,
  type TAssetDetails,
  type TDividendDetailList,
  type TRelatedStock,
  type TServiceResponse,
  type TStockQuote,
  type TTimeframe,
  ZAssetChartQuote,
  ZAssetDetails,
  ZDividendDetailList,
  ZRelatedStock,
  ZStockQuote,
} from '@budgetbuddyde/types';
import {format} from 'date-fns';
import fetch from 'node-fetch';
import {z} from 'zod';

import {type TStockSubscription} from '../core';
import {type TAssetSearchEntity, type TAssetWithQuote} from '../types';

export class StockService {
  private static host = process.env.STOCK_API_URL as string;

  /**
   * Retrieves the details of an asset based on its ISIN.
   * @param isin - The ISIN of the asset.
   * @param currency - The currency in which the asset details should be returned (default: 'EUR').
   * @returns A promise that resolves to a tuple containing the asset details and any error that occurred during the retrieval.
   */
  static async getAssetDetails(isin: string, currency: string = 'EUR'): Promise<TServiceResponse<TAssetDetails>> {
    try {
      const query = new URLSearchParams();
      query.append('currency', currency);
      query.append('expand', 'details');
      query.append('expand', 'yieldTTM');

      const response = await fetch(`${this.host}/v1/assets/${isin}?${query.toString()}`);
      const json = (await response.json()) as TAssetDetails;

      const parsingResult = ZAssetDetails.safeParse(json);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Searches for an asset based on the provided search term.
   * @param searchTerm - The term to search for.
   * @returns A promise that resolves to a service response containing an array of search results or an error.
   */
  static async searchAsset(searchTerm: string): Promise<TServiceResponse<TAssetSearchEntity[]>> {
    try {
      const response = await fetch(this.host + '/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({term: searchTerm}),
      });
      const json = (await response.json()) as {results: TAssetSearchEntity[]};
      return [json.results, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves assets with quotes from Parqet API.
   * @param assets - An array of asset symbols.
   * @param currency - The currency to retrieve the quotes in. Defaults to 'EUR'.
   * @returns A promise that resolves to a tuple containing the retrieved assets with quotes and any error that occurred during the retrieval.
   */
  static async getAssets(assets: string[], currency = 'EUR'): Promise<TServiceResponse<TAssetWithQuote[]>> {
    try {
      const query = new URLSearchParams();
      query.append('currency', currency);
      assets.forEach(asset => query.append('asset', asset));

      const response = await fetch(this.host + '/v1/assets?' + query.toString());
      const json = (await response.json()) as TAssetWithQuote[];
      return [json, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves a stock quote for a given asset.
   * @param asset - The asset for which to retrieve the quote.
   * @returns A promise that resolves to a tuple containing the stock quote data and any error that occurred during the retrieval.
   */
  static async getQuote(asset: Pick<TStockSubscription, 'isin' | 'exchange'>): Promise<TServiceResponse<TStockQuote>> {
    try {
      const query = new URLSearchParams();
      query.append('identifier', asset.isin);
      query.append('exchange', asset.exchange);
      query.append('splitAdjusted', 'true');
      query.append('currency', 'EUR');
      query.append('expand', 'asset');

      const response = await fetch(`${this.host}/v1/quotes/${format(new Date(), 'yyyy-MM-dd')}?${query.toString()}`);
      const json = (await response.json()) as TApiResponse<TStockQuote>;

      const parsingResult = ZStockQuote.safeParse(json);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves quotes for the specified assets.
   *
   * @param assets - An array of assets with their ISIN (International Securities Identification Number) and exchange.
   * @param timeframe - The timeframe for the quotes. Defaults to '1d'.
   * @returns A promise that resolves to a tuple containing the parsed quotes and any error that occurred during the process.
   */
  static async getQuotes(
    assets: {isin: string; exchange: string}[],
    timeframe: TTimeframe = '1d',
  ): Promise<TServiceResponse<TAssetChartQuote[]>> {
    try {
      const query = new URLSearchParams();
      query.append('currency', 'EUR');

      const response = await fetch(`${this.host}/v1/quotes?${query.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(
          assets.map(asset => ({
            identifier: asset.isin,
            timeframe: timeframe,
            exchange: asset.exchange,
          })),
        ),
      });
      const json = (await response.json()) as TAssetChartQuote[];

      const parsingResult = z.array(ZAssetChartQuote).safeParse(json);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves dividend details for the provided ISINs.
   * @param isin - An array of ISINs for which dividend details are to be retrieved.
   * @returns A promise that resolves to a tuple containing the dividend details and any error that occurred during the retrieval.
   */
  static async getDividends(isin: string[]): Promise<TServiceResponse<TDividendDetailList['dividendDetails']>> {
    if (isin.length === 0) return [null, new Error('No ISIN provided')];
    try {
      const query = new URLSearchParams();
      isin.forEach(asset => query.append('identifier', asset));
      query.append('expand', 'futureDividends');
      query.append('expand', 'historicalDividends');
      query.append('expand', 'asset');

      const response = await fetch(`${this.host}/v1/assets/dividends?${query.toString()}`);
      const json = await response.json();

      const parsingResult = ZDividendDetailList.safeParse(json);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data.dividendDetails, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves related stocks based on the provided ISIN.
   * @param isin - The ISIN of the stock.
   * @param amount - The number of related stocks to retrieve. Default is 8.
   * @returns A promise that resolves to a tuple containing the related stocks and any error that occurred during the retrieval.
   */
  static async getRelatedStocks(isin: string, amount = 8): Promise<TServiceResponse<TRelatedStock[]>> {
    try {
      const query = new URLSearchParams();
      query.append('limit', amount + '');

      const response = await fetch(`${this.host}/v1/assets/${isin}/related?${query.toString()}`);
      const json = (await response.json()) as {searchStrategy: string; relatedAssets: TRelatedStock[]};

      const parsingResult = z.array(ZRelatedStock).safeParse(json.relatedAssets);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
