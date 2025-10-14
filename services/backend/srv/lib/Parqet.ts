import { z } from "zod";
import {
  type ServiceResponse,
  Asset,
  SearchResponse,
  SearchResultItem,
  AssetQuote,
  DividendDetails,
} from "../types";

export class Parqet {
  private static apiHost = "https://api.parqet.com/v1"; // FIXME: Retrieve from environment variable

  public static async getAsset(
    isin: string,
  ): Promise<ServiceResponse<z.infer<typeof Asset>>> {
    const query = new URLSearchParams();
    query.append("currency", "EUR");
    query.append("expand", "details");
    query.append("expand", "yieldTTM");

    const response = await fetch(
      `${this.apiHost}/assets/${isin}?${query.toString()}`,
    );
    if (!response.ok) {
      return [
        null,
        new Error(
          `Failed to fetch asset data for ISIN ${isin}: ${response.statusText}`,
        ),
      ];
    }
    const jsonResponse = await response.json();

    const parsingResult = Asset.safeParse(jsonResponse);
    if (!parsingResult.success) {
      return [
        null,
        new Error(
          `Failed to parse asset data for ISIN ${isin}: ${JSON.stringify(parsingResult.error.issues)}`,
        ),
      ];
    }

    return [parsingResult.data, null];
  }

  public static async getQuotes(
    assets: {
      identifier: string;
    }[],
  ): Promise<ServiceResponse<Map<string, z.infer<typeof AssetQuote>>>> {
    const query = new URLSearchParams();
    query.append("skipNormalization", "true");
    query.append("currency", "EUR");
    query.append("resolution", "10");

    const requestBody: { identifier: string; timeframe: string }[] = assets.map(
      ({ identifier }) => ({
        identifier,
        timeframe: "1d",
      }),
    );

    const response = await fetch(`${this.apiHost}/quotes?${query.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      return [
        null,
        new Error("Failed to fetch quotes: " + response.statusText),
      ];
    }
    const jsonResponse = await response.json();

    const parsingResult = z.array(AssetQuote).safeParse(jsonResponse);
    if (!parsingResult.success) {
      return [
        null,
        new Error(
          "Failed to parse quotes: " +
            JSON.stringify(parsingResult.error.issues),
        ),
      ];
    }

    const quotes: Map<string, z.infer<typeof AssetQuote>> = new Map();

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
    {
      future = true,
      historical = false,
    }: { future: boolean; historical: boolean },
  ): Promise<ServiceResponse<z.infer<typeof DividendDetails>>> {
    const query = new URLSearchParams();
    if (future) {
      query.append("expand", "futureDividends");
    }
    if (historical) {
      query.append("expand", "historicalDividends");
    }
    // query.append("expand", "asset");
    for (const { identifier } of assets) {
      query.append("identifier", identifier);
    }

    const response = await fetch(
      `${this.apiHost}/assets/dividends?${query.toString()}`,
    );
    if (!response.ok) {
      return [
        null,
        new Error("Failed to fetch dividends: " + response.statusText),
      ];
    }

    const jsonResponse = await response.json();

    const parsingResult = DividendDetails.safeParse(jsonResponse);
    if (!parsingResult.success) {
      console.dir(jsonResponse, { depth: null });
      return [
        null,
        new Error(
          "Failed to parse dividend details: " +
            JSON.stringify(parsingResult.error.issues),
        ),
      ];
    }

    return [parsingResult.data, null];
  }

  public static async search(
    query: string,
  ): Promise<ServiceResponse<z.infer<typeof SearchResultItem>[]>> {
    const response = await fetch(`${this.apiHost}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ term: query }),
    });
    if (!response.ok) {
      return [
        null,
        new Error(
          `Failed to search assets for query ${query}: ${response.statusText}`,
        ),
      ];
    }
    const jsonResponse = await response.json();

    const parsingResult = SearchResponse.safeParse(jsonResponse);
    if (!parsingResult.success) {
      return [
        null,
        new Error(
          "Failed to parse search results: " +
            JSON.stringify(parsingResult.error.issues),
        ),
      ];
    }

    return [parsingResult.data.results, null];
  }
}
