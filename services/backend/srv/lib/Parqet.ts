import { z } from 'zod';
import { type ServiceResponse, ParqetSchemas, Timeframe } from '@budgetbuddyde/types';

// FIXME: Improve error handling and logging by a LOT
export class Parqet {
  private static apiHost = 'https://api.parqet.com/v1'; // FIXME: Retrieve from environment variable

  public static async getAsset(
    identifier: string
  ): Promise<ServiceResponse<z.infer<typeof ParqetSchemas.Asset>>> {
    const query = new URLSearchParams();
    query.append('currency', 'EUR');
    query.append('expand', 'details');
    query.append('expand', 'yieldTTM');

    const response = await fetch(`${this.apiHost}/assets/${identifier}?${query.toString()}`);
    if (!response.ok) {
      return [
        null,
        new Error(`Failed to fetch asset data for ISIN ${identifier}: ${response.statusText}`),
      ];
    }
    const jsonResponse = await response.json();

    const parsingResult = ParqetSchemas.Asset.safeParse(jsonResponse);
    if (!parsingResult.success) {
      return [
        null,
        new Error(
          `Failed to parse asset data for ISIN ${identifier}: ${JSON.stringify(parsingResult.error.issues)}`
        ),
      ];
    }

    return [parsingResult.data, null];
  }

  public static async getQuotes(
    assets: {
      identifier: string;
    }[],
    timeframe: z.infer<typeof Timeframe> = '3m',
    currency = 'EUR'
  ): Promise<ServiceResponse<Map<string, z.infer<typeof ParqetSchemas.AssetQuote>>>> {
    const query = new URLSearchParams();
    // query.append('skipNormalization', 'true');
    query.append('currency', currency);
    // query.append('resolution', '10');

    const requestBody: { identifier: string; timeframe: string }[] = assets.map(
      ({ identifier }) => ({
        identifier,
        timeframe: timeframe,
      })
    );

    const response = await fetch(`${this.apiHost}/quotes?${query.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      return [null, new Error('Failed to fetch quotes: ' + response.statusText)];
    }
    const jsonResponse = await response.json();

    const parsingResult = z.array(ParqetSchemas.AssetQuote).safeParse(jsonResponse);
    if (!parsingResult.success) {
      return [
        null,
        new Error('Failed to parse quotes: ' + JSON.stringify(parsingResult.error.issues)),
      ];
    }

    const quotes: Map<string, z.infer<typeof ParqetSchemas.AssetQuote>> = new Map();

    for (const quote of parsingResult.data) {
      const key = quote.assetIdentifier;
      if (quotes.has(key)) continue;
      quotes.set(key, quote);
    }

    return [quotes, null];
  }

  public static async getDividends(
    assets: {
      identifier: string;
    }[],
    { future = true, historical = false }: { future: boolean; historical: boolean }
  ): Promise<ServiceResponse<z.infer<typeof ParqetSchemas.DividendDetails>>> {
    const query = new URLSearchParams();
    if (future) {
      query.append('expand', 'futureDividends');
    }
    if (historical) {
      query.append('expand', 'historicalDividends');
    }
    // query.append("expand", "asset");
    for (const { identifier } of assets) {
      query.append('identifier', identifier);
    }

    const response = await fetch(`${this.apiHost}/assets/dividends?${query.toString()}`);
    if (!response.ok) {
      return [null, new Error('Failed to fetch dividends: ' + response.statusText)];
    }

    const jsonResponse = await response.json();

    const parsingResult = ParqetSchemas.DividendDetails.safeParse(jsonResponse);
    if (!parsingResult.success) {
      return [
        null,
        new Error(
          'Failed to parse dividend details: ' + JSON.stringify(parsingResult.error.issues)
        ),
      ];
    }

    return [parsingResult.data, null];
  }

  public static async search(
    query: string
  ): Promise<ServiceResponse<z.infer<typeof ParqetSchemas.SearchResultItem>[]>> {
    const response = await fetch(`${this.apiHost}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ term: query }),
    });
    if (!response.ok) {
      return [
        null,
        new Error(`Failed to search assets for query ${query}: ${response.statusText}`),
      ];
    }
    const jsonResponse = await response.json();

    const parsingResult = ParqetSchemas.SearchResponse.safeParse(jsonResponse);
    if (!parsingResult.success) {
      return [
        null,
        new Error('Failed to parse search results: ' + JSON.stringify(parsingResult.error.issues)),
      ];
    }

    return [parsingResult.data.results, null];
  }

  public static async getRelatedAssets(
    isin: string,
    limit = 6
  ): Promise<ServiceResponse<z.infer<typeof ParqetSchemas.RelatedAsset>[]>> {
    try {
      const query = new URLSearchParams();
      query.append('limit', limit.toString());

      const response = await fetch(`${this.apiHost}/assets/${isin}/related?${query.toString()}`);
      if (!response.ok) {
        return [null, new Error(response.statusText)];
      }

      const json = await response.json();
      const parsingResult = z
        .object({
          searchStrategy: z.string(),
          relatedAssets: z.array(ParqetSchemas.RelatedAsset),
        })
        .safeParse(json);
      if (!parsingResult.success) {
        throw parsingResult.error;
      }
      return [parsingResult.data.relatedAssets, null];
    } catch (error) {
      return [null, error instanceof Error ? error : new Error(String(error))];
    }
  }

  public static async getSectors(): Promise<
    ServiceResponse<z.infer<typeof ParqetSchemas.Sector>[]>
  > {
    try {
      const response = await fetch(`${this.apiHost}/sectors`);
      if (!response.ok) {
        return [null, new Error(response.statusText)];
      }

      const json = await response.json();
      const parsingResult = z.array(ParqetSchemas.Sector).safeParse(json);
      if (!parsingResult.success) {
        throw parsingResult.error;
      }
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error instanceof Error ? error : new Error(String(error))];
    }
  }

  public static async getRegions(): Promise<
    ServiceResponse<z.infer<typeof ParqetSchemas.Region>[]>
  > {
    try {
      const response = await fetch(`${this.apiHost}/regions`);
      if (!response.ok) {
        return [null, new Error(response.statusText)];
      }

      const json = await response.json();
      const parsingResult = z.array(ParqetSchemas.Region).safeParse(json);
      if (!parsingResult.success) {
        throw parsingResult.error;
      }
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error instanceof Error ? error : new Error(String(error))];
    }
  }

  public static async getIndustries(): Promise<
    ServiceResponse<z.infer<typeof ParqetSchemas.Industry>[]>
  > {
    try {
      const response = await fetch(`${this.apiHost}/industries`);
      if (!response.ok) {
        return [null, new Error(response.statusText)];
      }

      const json = await response.json();
      const parsingResult = z.array(ParqetSchemas.Industry).safeParse(json);
      if (!parsingResult.success) {
        throw parsingResult.error;
      }
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error instanceof Error ? error : new Error(String(error))];
    }
  }

  public static async getCountries(): Promise<
    ServiceResponse<z.infer<typeof ParqetSchemas.Country>[]>
  > {
    try {
      const response = await fetch(`${this.apiHost}/countries`);
      if (!response.ok) {
        return [null, new Error(response.statusText)];
      }

      const json = await response.json();
      const parsingResult = z.array(ParqetSchemas.Country).safeParse(json);
      if (!parsingResult.success) {
        throw parsingResult.error;
      }
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error instanceof Error ? error : new Error(String(error))];
    }
  }
}
